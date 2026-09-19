import { describe, expect, it } from "vitest";
import { getUserStats } from "@/server/services/stats";
import {
  createReviewLog,
  createSolution,
  getReviewAccuracy,
  getUserActivityForDate,
  listUserProblems,
  searchUserProblems,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry, uniqueSlug } from "./helpers";

describe("stats and journal filters", () => {
  it("aggregates counts and review accuracy", async () => {
    const user = await createTestUser();
    const solvedSlug = uniqueSlug("stats-solved");
    const attemptingSlug = uniqueSlug("stats-attempting");

    const solved = await seedJournalEntry({
      userId: user.id,
      slug: solvedSlug,
      status: "solved",
      difficulty: "EASY",
      topics: [{ slug: "array", name: "Array" }],
    });
    await seedJournalEntry({
      userId: user.id,
      slug: attemptingSlug,
      status: "attempting",
      difficulty: "HARD",
    });

    const solvedAt = new Date("2026-09-10T12:00:00.000Z");
    await updateUserProblem(user.id, solved.entry.id, {
      status: "solved",
      solvedAt,
      leitnerBox: 2,
    });

    await createReviewLog({
      userProblemId: solved.entry.id,
      outcome: "pass",
      fromBox: 1,
      toBox: 2,
      reviewedAt: new Date("2026-09-11T12:00:00.000Z"),
    });
    await createReviewLog({
      userProblemId: solved.entry.id,
      outcome: "fail",
      fromBox: 2,
      toBox: 1,
      reviewedAt: new Date("2026-09-12T12:00:00.000Z"),
    });

    await createSolution({
      userProblemId: solved.entry.id,
      title: "Java",
      language: "java",
      bodyMd: "class Solution {}",
    });

    const stats = await getUserStats(user.id);
    expect(stats.total).toBe(2);
    expect(stats.solved).toBe(1);
    expect(stats.byDifficulty.some((row) => row.difficulty === "EASY")).toBe(true);
    expect(stats.byBox.some((row) => row.leitnerBox === 2)).toBe(true);
    expect(stats.reviewAccuracy.total).toBe(2);
    expect(stats.reviewAccuracy.pass).toBe(1);
    expect(stats.reviewAccuracy.fail).toBe(1);
  });

  it("filters journal entries and searches by query", async () => {
    const user = await createTestUser();
    const slug = uniqueSlug("filter-target");
    await seedJournalEntry({
      userId: user.id,
      slug,
      title: "Unique Filter Target",
      status: "attempting",
      difficulty: "MEDIUM",
    });
    await seedJournalEntry({
      userId: user.id,
      slug: uniqueSlug("other"),
      title: "Other Problem",
      status: "solved",
      difficulty: "EASY",
    });

    const byStatus = await listUserProblems(user.id, { status: "attempting" });
    expect(byStatus.some((row) => row.problem.slug === slug)).toBe(true);
    expect(byStatus.every((row) => row.status === "attempting")).toBe(true);

    const byDifficulty = await listUserProblems(user.id, {
      difficulty: "MEDIUM",
    });
    expect(byDifficulty.some((row) => row.problem.slug === slug)).toBe(true);

    const byQuery = await listUserProblems(user.id, {
      query: "Unique Filter",
    });
    expect(byQuery).toHaveLength(1);
    expect(byQuery[0]?.problem.slug).toBe(slug);

    const search = await searchUserProblems(user.id, "Unique Filter");
    expect(search[0]?.problem.slug).toBe(slug);
  });

  it("returns activity for a specific day", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({
      userId: user.id,
      status: "solved",
      title: "Activity Problem",
    });

    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    await updateUserProblem(user.id, entry.id, {
      status: "solved",
      solvedAt: now,
    });

    await createSolution({
      userProblemId: entry.id,
      title: "Ruby",
      language: "ruby",
      bodyMd: "def solve; end",
    });

    const activity = await getUserActivityForDate(user.id, day);
    expect(activity.some((row) => row.userProblemId === entry.id)).toBe(true);
    expect(
      activity.find((row) => row.userProblemId === entry.id)?.activities,
    ).toEqual(expect.arrayContaining(["solved", "solution"]));

    const accuracy = await getReviewAccuracy(user.id);
    expect(accuracy.total).toBe(0);
  });
});
