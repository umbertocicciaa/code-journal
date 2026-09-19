import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/server/db/client";
import {
  company,
  problem,
  problemCompany,
  problemTopic,
  topic,
  type Difficulty,
  type ProblemSource,
} from "@/server/db/schema";

export interface ProblemInput {
  slug: string;
  leetcodeFrontendId?: string | null;
  title: string;
  difficulty: Difficulty;
  descriptionMd?: string;
  url: string;
  source: ProblemSource;
  isPaidOnly?: boolean;
  fetchedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  topics?: Array<{ slug: string; name: string }>;
  companies?: Array<{ slug: string; name: string; frequency?: number }>;
}

async function upsertTopics(topics: Array<{ slug: string; name: string }>) {
  if (topics.length === 0) {
    return new Map<string, string>();
  }

  const topicMap = new Map<string, string>();
  for (const item of topics) {
    const existing = await db.query.topic.findFirst({
      where: eq(topic.slug, item.slug),
    });
    if (existing) {
      topicMap.set(item.slug, existing.id);
      continue;
    }
    const id = nanoid();
    await db.insert(topic).values({
      id,
      slug: item.slug,
      name: item.name,
    });
    topicMap.set(item.slug, id);
  }
  return topicMap;
}

async function upsertCompanies(
  companies: Array<{ slug: string; name: string; frequency?: number }>,
) {
  if (companies.length === 0) {
    return new Map<string, string>();
  }

  const companyMap = new Map<string, string>();
  for (const item of companies) {
    const existing = await db.query.company.findFirst({
      where: eq(company.slug, item.slug),
    });
    if (existing) {
      companyMap.set(item.slug, existing.id);
      continue;
    }
    const id = nanoid();
    await db.insert(company).values({
      id,
      slug: item.slug,
      name: item.name,
    });
    companyMap.set(item.slug, id);
  }
  return companyMap;
}

async function syncProblemRelations(
  problemId: string,
  topics: Array<{ slug: string; name: string }>,
  companies: Array<{ slug: string; name: string; frequency?: number }>,
) {
  const topicMap = await upsertTopics(topics);
  const companyMap = await upsertCompanies(companies);

  await db.delete(problemTopic).where(eq(problemTopic.problemId, problemId));
  await db.delete(problemCompany).where(eq(problemCompany.problemId, problemId));

  if (topicMap.size > 0) {
    await db.insert(problemTopic).values(
      [...topicMap.entries()].map(([, topicId]) => ({
        problemId,
        topicId,
      })),
    );
  }

  if (companyMap.size > 0) {
    await db.insert(problemCompany).values(
      companies
        .map((item) => {
          const companyId = companyMap.get(item.slug);
          if (!companyId) {
            return null;
          }
          return {
            problemId,
            companyId,
            frequency: item.frequency ?? null,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    );
  }
}

export async function findProblemBySlug(slug: string) {
  return db.query.problem.findFirst({
    where: eq(problem.slug, slug),
    with: {
      problemTopics: { with: { topic: true } },
      problemCompanies: { with: { company: true } },
    },
  });
}

export async function findProblemById(id: string) {
  return db.query.problem.findFirst({
    where: eq(problem.id, id),
    with: {
      problemTopics: { with: { topic: true } },
      problemCompanies: { with: { company: true } },
    },
  });
}

export async function createProblem(input: ProblemInput) {
  const id = nanoid();
  await db.insert(problem).values({
    id,
    slug: input.slug,
    leetcodeFrontendId: input.leetcodeFrontendId ?? null,
    title: input.title,
    difficulty: input.difficulty,
    descriptionMd: input.descriptionMd ?? "",
    url: input.url,
    source: input.source,
    isPaidOnly: input.isPaidOnly ?? false,
    fetchedAt: input.fetchedAt ?? null,
    createdBy: input.createdBy ?? null,
    updatedBy: input.updatedBy ?? null,
  });

  await syncProblemRelations(
    id,
    input.topics ?? [],
    input.companies ?? [],
  );

  return findProblemById(id);
}

export async function updateProblem(id: string, input: Partial<ProblemInput>) {
  await db
    .update(problem)
    .set({
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.leetcodeFrontendId !== undefined
        ? { leetcodeFrontendId: input.leetcodeFrontendId }
        : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.descriptionMd !== undefined
        ? { descriptionMd: input.descriptionMd }
        : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.isPaidOnly !== undefined ? { isPaidOnly: input.isPaidOnly } : {}),
      ...(input.fetchedAt !== undefined ? { fetchedAt: input.fetchedAt } : {}),
      ...(input.updatedBy !== undefined ? { updatedBy: input.updatedBy } : {}),
      updatedAt: new Date(),
    })
    .where(eq(problem.id, id));

  if (input.topics || input.companies) {
    const existing = await findProblemById(id);
    await syncProblemRelations(
      id,
      input.topics ??
        existing?.problemTopics.map((pt) => ({
          slug: pt.topic.slug,
          name: pt.topic.name,
        })) ??
        [],
      input.companies ??
        existing?.problemCompanies.map((pc) => ({
          slug: pc.company.slug,
          name: pc.company.name,
          frequency: pc.frequency ?? undefined,
        })) ??
        [],
    );
  }

  return findProblemById(id);
}

export async function searchTopics(query: string) {
  return db.query.topic.findMany({
    where: ilike(topic.name, `%${query}%`),
    limit: 20,
  });
}

export async function searchCompanies(query: string) {
  return db.query.company.findMany({
    where: ilike(company.name, `%${query}%`),
    limit: 20,
  });
}

export async function getTopicsForProblems(problemIds: string[]) {
  if (problemIds.length === 0) {
    return [];
  }
  return db
    .select({
      problemId: problemTopic.problemId,
      topicName: topic.name,
      topicSlug: topic.slug,
    })
    .from(problemTopic)
    .innerJoin(topic, eq(problemTopic.topicId, topic.id))
    .where(inArray(problemTopic.problemId, problemIds));
}

export async function countProblemsByDifficulty() {
  return db
    .select({
      difficulty: problem.difficulty,
      count: sql<number>`count(*)::int`,
    })
    .from(problem)
    .groupBy(problem.difficulty);
}

export async function findProblemsByFilters(filters: {
  query?: string;
  difficulty?: Difficulty;
  topicSlug?: string;
}) {
  const conditions = [];
  if (filters.query) {
    conditions.push(
      or(
        ilike(problem.title, `%${filters.query}%`),
        ilike(problem.slug, `%${filters.query}%`),
      ),
    );
  }
  if (filters.difficulty) {
    conditions.push(eq(problem.difficulty, filters.difficulty));
  }

  const rows = await db.query.problem.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      problemTopics: { with: { topic: true } },
      problemCompanies: { with: { company: true } },
    },
    limit: 100,
  });

  if (!filters.topicSlug) {
    return rows;
  }

  return rows.filter((row) =>
    row.problemTopics.some((pt) => pt.topic.slug === filters.topicSlug),
  );
}
