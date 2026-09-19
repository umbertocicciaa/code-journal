import { describe, expect, it } from "vitest";
import {
  exportJournal,
  importJournal,
} from "@/server/services/journal-transfer";
import {
  createReviewLog,
  createSolution,
  createUserTag,
  findUserProblemById,
  listUserProblems,
  setUserProblemTags,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry, uniqueSlug } from "./helpers";

describe("journal export and import", () => {
  it("exports a full journal payload", async () => {
    const user = await createTestUser();
    const slug = uniqueSlug("export-problem");
    const { entry } = await seedJournalEntry({
      userId: user.id,
      slug,
      title: "Export Me",
      status: "solved",
      notesMd: "Important notes",
    });

    const tag = await createUserTag({
      userId: user.id,
      name: "Export Tag",
      color: "#ff6b3b",
    });
    await setUserProblemTags(user.id, entry.id, [tag!.id]);

    await createSolution({
      userProblemId: entry.id,
      title: "Python",
      language: "python",
      bodyMd: "return 42",
    });

    await createReviewLog({
      userProblemId: entry.id,
      outcome: "pass",
      fromBox: 0,
      toBox: 1,
    });

    const payload = await exportJournal(user.id);

    expect(payload.format).toBe("code-journal");
    expect(payload.version).toBe(1);
    expect(payload.tags.some((item) => item.name === "Export Tag")).toBe(true);

    const exported = payload.entries.find((item) => item.problem.slug === slug);
    expect(exported?.notesMd).toBe("Important notes");
    expect(exported?.solutions).toHaveLength(1);
    expect(exported?.reviewLogs).toHaveLength(1);
    expect(exported?.tags).toContain("Export Tag");
  });

  it("imports into an empty journal", async () => {
    const user = await createTestUser();
    const slug = uniqueSlug("import-problem");

    const summary = await importJournal(
      user.id,
      {
        format: "code-journal",
        version: 1,
        exportedAt: new Date().toISOString(),
        tags: [{ name: "Imported", color: "#6366f1" }],
        entries: [
          {
            problem: {
              slug,
              title: "Imported Problem",
              difficulty: "EASY",
              url: `https://leetcode.com/problems/${slug}/`,
              source: "manual",
              leetcodeFrontendId: null,
              isPaidOnly: false,
              descriptionMd: "Imported description",
              topics: [{ slug: "hash-table", name: "Hash Table" }],
              companies: [],
            },
            status: "solved",
            solvedAt: "2026-09-01T10:00:00.000Z",
            notesMd: "From backup",
            leitnerBox: 2,
            nextReviewAt: "2026-09-25T10:00:00.000Z",
            lastReviewedAt: "2026-09-18T10:00:00.000Z",
            reviewCount: 1,
            tags: ["Imported"],
            solutions: [
              {
                title: "Rust",
                language: "rust",
                bodyMd: "fn solve() {}",
                createdAt: "2026-09-01T10:05:00.000Z",
                updatedAt: "2026-09-01T10:05:00.000Z",
              },
            ],
            reviewLogs: [
              {
                reviewedAt: "2026-09-18T10:00:00.000Z",
                outcome: "pass",
                fromBox: 1,
                toBox: 2,
              },
            ],
          },
        ],
      },
      { overwriteExisting: false },
    );

    expect(summary.created).toBe(1);
    expect(summary.problemsCreated).toBe(1);
    expect(summary.tagsCreated).toBe(1);
    expect(summary.solutionsAdded).toBe(1);
    expect(summary.reviewLogsAdded).toBe(1);

    const rows = await listUserProblems(user.id);
    const imported = rows.find((row) => row.problem.slug === slug);
    expect(imported?.notesMd).toBe("From backup");
    expect(imported?.userProblemTags.some((tag) => tag.userTag.name === "Imported")).toBe(
      true,
    );
  });

  it("skips existing entries unless overwrite is enabled", async () => {
    const user = await createTestUser();
    const slug = uniqueSlug("overwrite-problem");
    const { entry } = await seedJournalEntry({
      userId: user.id,
      slug,
      notesMd: "Original",
      status: "solved",
    });

    const skipped = await importJournal(
      user.id,
      {
        format: "code-journal",
        version: 1,
        exportedAt: new Date().toISOString(),
        tags: [],
        entries: [
          {
            problem: {
              slug,
              title: "Overwrite Problem",
              difficulty: "MEDIUM",
              url: `https://leetcode.com/problems/${slug}/`,
              source: "manual",
              leetcodeFrontendId: null,
              isPaidOnly: false,
              descriptionMd: "",
              topics: [],
              companies: [],
            },
            status: "solved",
            solvedAt: null,
            notesMd: "Should not apply",
            leitnerBox: 4,
            nextReviewAt: null,
            lastReviewedAt: null,
            reviewCount: 0,
            tags: [],
            solutions: [],
            reviewLogs: [],
          },
        ],
      },
      { overwriteExisting: false },
    );

    expect(skipped.skipped).toBe(1);
    expect(skipped.updated).toBe(0);

    let loaded = await findUserProblemById(user.id, entry.id);
    expect(loaded?.notesMd).toBe("Original");

    const overwritten = await importJournal(
      user.id,
      {
        format: "code-journal",
        version: 1,
        exportedAt: new Date().toISOString(),
        tags: [],
        entries: [
          {
            problem: {
              slug,
              title: "Overwrite Problem",
              difficulty: "MEDIUM",
              url: `https://leetcode.com/problems/${slug}/`,
              source: "manual",
              leetcodeFrontendId: null,
              isPaidOnly: false,
              descriptionMd: "",
              topics: [],
              companies: [],
            },
            status: "solved",
            solvedAt: null,
            notesMd: "Updated from backup",
            leitnerBox: 4,
            nextReviewAt: null,
            lastReviewedAt: null,
            reviewCount: 0,
            tags: [],
            solutions: [],
            reviewLogs: [],
          },
        ],
      },
      { overwriteExisting: true },
    );

    expect(overwritten.updated).toBe(1);
    loaded = await findUserProblemById(user.id, entry.id);
    expect(loaded?.notesMd).toBe("Updated from backup");
    expect(loaded?.leitnerBox).toBe(4);
  });

  it("round-trips export and import to a second user", async () => {
    const source = await createTestUser();
    const target = await createTestUser();
    const slug = uniqueSlug("roundtrip");
    const { entry } = await seedJournalEntry({
      userId: source.id,
      slug,
      status: "solved",
      notesMd: "Round trip",
    });

    await updateUserProblem(source.id, entry.id, {
      leitnerBox: 2,
      reviewCount: 1,
    });

    await createSolution({
      userProblemId: entry.id,
      title: "C++",
      language: "cpp",
      bodyMd: "class Solution {};",
    });

    const exported = await exportJournal(source.id);
    const summary = await importJournal(target.id, exported, {
      overwriteExisting: false,
    });

    expect(summary.created).toBe(1);
    expect(summary.solutionsAdded).toBe(1);

    const rows = await listUserProblems(target.id);
    const imported = rows.find((row) => row.problem.slug === slug);
    expect(imported?.notesMd).toBe("Round trip");
    expect(imported?.leitnerBox).toBe(2);
  });
});
