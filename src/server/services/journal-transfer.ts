import { and, asc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/server/db/client";
import {
  company,
  problem,
  problemCompany,
  problemTopic,
  reviewLog,
  solution,
  topic,
  userProblem,
  userProblemTag,
  userTag,
} from "@/server/db/schema";
import {
  JOURNAL_EXPORT_FORMAT,
  JOURNAL_EXPORT_VERSION,
  type ExportedJournalEntry,
  type JournalExport,
} from "@/server/validation";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface JournalImportOptions {
  overwriteExisting: boolean;
}

export interface JournalImportSummary {
  entries: number;
  created: number;
  updated: number;
  skipped: number;
  problemsCreated: number;
  tagsCreated: number;
  solutionsAdded: number;
  reviewLogsAdded: number;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

// --- Export ------------------------------------------------------------------

export async function exportJournal(userId: string): Promise<JournalExport> {
  const [tags, rows] = await Promise.all([
    db.query.userTag.findMany({
      where: eq(userTag.userId, userId),
      orderBy: [asc(userTag.name)],
    }),
    db.query.userProblem.findMany({
      where: eq(userProblem.userId, userId),
      with: {
        problem: {
          with: {
            problemTopics: { with: { topic: true } },
            problemCompanies: { with: { company: true } },
          },
        },
        solutions: { orderBy: [asc(solution.createdAt)] },
        userProblemTags: { with: { userTag: true } },
        reviewLogs: { orderBy: [asc(reviewLog.reviewedAt)] },
      },
      orderBy: [asc(userProblem.createdAt)],
    }),
  ]);

  const entries: ExportedJournalEntry[] = rows.map((row) => ({
    problem: {
      slug: row.problem.slug,
      title: row.problem.title,
      difficulty: row.problem.difficulty,
      url: row.problem.url,
      source: row.problem.source,
      leetcodeFrontendId: row.problem.leetcodeFrontendId,
      isPaidOnly: row.problem.isPaidOnly,
      descriptionMd: row.problem.descriptionMd,
      topics: row.problem.problemTopics.map((pt) => ({
        slug: pt.topic.slug,
        name: pt.topic.name,
      })),
      companies: row.problem.problemCompanies.map((pc) => ({
        slug: pc.company.slug,
        name: pc.company.name,
        frequency: pc.frequency,
      })),
    },
    status: row.status,
    solvedAt: toIso(row.solvedAt),
    notesMd: row.notesMd,
    leitnerBox: row.leitnerBox,
    nextReviewAt: toIso(row.nextReviewAt),
    lastReviewedAt: toIso(row.lastReviewedAt),
    reviewCount: row.reviewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tags: row.userProblemTags.map((tag) => tag.userTag.name),
    solutions: row.solutions.map((item) => ({
      title: item.title,
      language: item.language,
      bodyMd: item.bodyMd,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    reviewLogs: row.reviewLogs.map((log) => ({
      reviewedAt: log.reviewedAt.toISOString(),
      outcome: log.outcome,
      fromBox: log.fromBox,
      toBox: log.toBox,
    })),
  }));

  return {
    format: JOURNAL_EXPORT_FORMAT,
    version: JOURNAL_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tags: tags.map((tag) => ({ name: tag.name, color: tag.color })),
    entries,
  };
}

// --- Import ------------------------------------------------------------------

async function ensureTags(
  tx: Transaction,
  userId: string,
  payload: JournalExport,
  summary: JournalImportSummary,
) {
  const existing = await tx.query.userTag.findMany({
    where: eq(userTag.userId, userId),
  });
  const byName = new Map(existing.map((tag) => [tag.name.toLowerCase(), tag.id]));

  const wanted = new Map<string, { name: string; color: string }>();
  for (const tag of payload.tags) {
    wanted.set(tag.name.toLowerCase(), tag);
  }
  for (const entry of payload.entries) {
    for (const name of entry.tags) {
      const key = name.toLowerCase();
      if (!wanted.has(key)) {
        wanted.set(key, { name, color: "#6366f1" });
      }
    }
  }

  for (const [key, tag] of wanted) {
    if (byName.has(key)) {
      continue;
    }
    const id = nanoid();
    await tx.insert(userTag).values({
      id,
      userId,
      name: tag.name,
      color: tag.color,
    });
    byName.set(key, id);
    summary.tagsCreated += 1;
  }

  return byName;
}

async function upsertBySlug(
  tx: Transaction,
  table: typeof topic | typeof company,
  items: Array<{ slug: string; name: string }>,
) {
  const ids = new Map<string, string>();
  if (items.length === 0) {
    return ids;
  }
  const existing = await tx
    .select({ id: table.id, slug: table.slug })
    .from(table)
    .where(inArray(table.slug, items.map((item) => item.slug)));
  for (const row of existing) {
    ids.set(row.slug, row.id);
  }
  for (const item of items) {
    if (ids.has(item.slug)) {
      continue;
    }
    const id = nanoid();
    await tx.insert(table).values({ id, slug: item.slug, name: item.name });
    ids.set(item.slug, id);
  }
  return ids;
}

async function ensureProblem(
  tx: Transaction,
  userId: string,
  input: ExportedJournalEntry["problem"],
  summary: JournalImportSummary,
) {
  const existing = await tx.query.problem.findFirst({
    where: eq(problem.slug, input.slug),
  });

  if (existing) {
    // Enrich a bare shared record without overwriting curated data.
    if (existing.descriptionMd.trim() === "" && input.descriptionMd.trim() !== "") {
      await tx
        .update(problem)
        .set({
          descriptionMd: input.descriptionMd,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(problem.id, existing.id));
    }
    return existing.id;
  }

  const id = nanoid();
  await tx.insert(problem).values({
    id,
    slug: input.slug,
    leetcodeFrontendId: input.leetcodeFrontendId,
    title: input.title,
    difficulty: input.difficulty,
    descriptionMd: input.descriptionMd,
    url: input.url,
    source: input.source,
    isPaidOnly: input.isPaidOnly,
    createdBy: userId,
    updatedBy: userId,
  });

  const topicIds = await upsertBySlug(tx, topic, input.topics);
  if (topicIds.size > 0) {
    await tx.insert(problemTopic).values(
      [...topicIds.values()].map((topicId) => ({ problemId: id, topicId })),
    );
  }

  const companyIds = await upsertBySlug(tx, company, input.companies);
  if (companyIds.size > 0) {
    await tx.insert(problemCompany).values(
      input.companies.flatMap((item) => {
        const companyId = companyIds.get(item.slug);
        return companyId
          ? [{ problemId: id, companyId, frequency: item.frequency }]
          : [];
      }),
    );
  }

  summary.problemsCreated += 1;
  return id;
}

async function mergeSolutions(
  tx: Transaction,
  userProblemId: string,
  items: ExportedJournalEntry["solutions"],
  summary: JournalImportSummary,
) {
  if (items.length === 0) {
    return;
  }
  const existing = await tx.query.solution.findMany({
    where: eq(solution.userProblemId, userProblemId),
  });
  const seen = new Set(
    existing.map((row) => `${row.language}\u0000${row.title}\u0000${row.bodyMd}`),
  );

  for (const item of items) {
    const key = `${item.language}\u0000${item.title}\u0000${item.bodyMd}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const createdAt = toDate(item.createdAt) ?? new Date();
    await tx.insert(solution).values({
      id: nanoid(),
      userProblemId,
      title: item.title,
      language: item.language,
      bodyMd: item.bodyMd,
      createdAt,
      updatedAt: toDate(item.updatedAt) ?? createdAt,
    });
    summary.solutionsAdded += 1;
  }
}

async function mergeReviewLogs(
  tx: Transaction,
  userProblemId: string,
  items: ExportedJournalEntry["reviewLogs"],
  summary: JournalImportSummary,
) {
  if (items.length === 0) {
    return;
  }
  const existing = await tx.query.reviewLog.findMany({
    where: eq(reviewLog.userProblemId, userProblemId),
  });
  const seen = new Set(
    existing.map(
      (row) =>
        `${row.reviewedAt.toISOString()}|${row.outcome}|${row.fromBox}|${row.toBox}`,
    ),
  );

  for (const item of items) {
    const reviewedAt = new Date(item.reviewedAt);
    const key = `${reviewedAt.toISOString()}|${item.outcome}|${item.fromBox}|${item.toBox}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    await tx.insert(reviewLog).values({
      id: nanoid(),
      userProblemId,
      reviewedAt,
      outcome: item.outcome,
      fromBox: item.fromBox,
      toBox: item.toBox,
    });
    summary.reviewLogsAdded += 1;
  }
}

async function mergeTags(
  tx: Transaction,
  userProblemId: string,
  names: string[],
  tagIdsByName: Map<string, string>,
) {
  if (names.length === 0) {
    return;
  }
  const existing = await tx.query.userProblemTag.findMany({
    where: eq(userProblemTag.userProblemId, userProblemId),
  });
  const attached = new Set(existing.map((row) => row.userTagId));

  const rows = names.flatMap((name) => {
    const tagId = tagIdsByName.get(name.toLowerCase());
    if (!tagId || attached.has(tagId)) {
      return [];
    }
    attached.add(tagId);
    return [{ userProblemId, userTagId: tagId }];
  });

  if (rows.length > 0) {
    await tx.insert(userProblemTag).values(rows);
  }
}

export async function importJournal(
  userId: string,
  payload: JournalExport,
  options: JournalImportOptions,
): Promise<JournalImportSummary> {
  const summary: JournalImportSummary = {
    entries: payload.entries.length,
    created: 0,
    updated: 0,
    skipped: 0,
    problemsCreated: 0,
    tagsCreated: 0,
    solutionsAdded: 0,
    reviewLogsAdded: 0,
  };

  await db.transaction(async (tx) => {
    const tagIdsByName = await ensureTags(tx, userId, payload, summary);

    for (const entry of payload.entries) {
      const problemId = await ensureProblem(tx, userId, entry.problem, summary);

      const existing = await tx.query.userProblem.findFirst({
        where: and(
          eq(userProblem.userId, userId),
          eq(userProblem.problemId, problemId),
        ),
      });

      const fields = {
        status: entry.status,
        solvedAt: toDate(entry.solvedAt),
        notesMd: entry.notesMd,
        leitnerBox: entry.leitnerBox,
        nextReviewAt: toDate(entry.nextReviewAt),
        lastReviewedAt: toDate(entry.lastReviewedAt),
        reviewCount: entry.reviewCount,
      };

      let userProblemId: string;
      if (!existing) {
        userProblemId = nanoid();
        const createdAt = toDate(entry.createdAt) ?? new Date();
        await tx.insert(userProblem).values({
          id: userProblemId,
          userId,
          problemId,
          ...fields,
          createdAt,
          updatedAt: toDate(entry.updatedAt) ?? createdAt,
        });
        summary.created += 1;
      } else {
        userProblemId = existing.id;
        if (options.overwriteExisting) {
          await tx
            .update(userProblem)
            .set({ ...fields, updatedAt: new Date() })
            .where(eq(userProblem.id, existing.id));
          summary.updated += 1;
        } else {
          summary.skipped += 1;
        }
      }

      await mergeSolutions(tx, userProblemId, entry.solutions, summary);
      await mergeReviewLogs(tx, userProblemId, entry.reviewLogs, summary);
      await mergeTags(tx, userProblemId, entry.tags, tagIdsByName);
    }
  });

  return summary;
}
