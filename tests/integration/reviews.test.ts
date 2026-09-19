import { describe, expect, it } from "vitest";
import { applyReview } from "@/lib/leitner";
import {
  createReviewLog,
  findUserProblemById,
  listDueReviews,
  listKanbanProblems,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry } from "./helpers";

describe("leitner reviews", () => {
  it("initializes leitner state when marking a problem solved", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({
      userId: user.id,
      status: "attempting",
    });

    const now = new Date();
    await updateUserProblem(user.id, entry.id, {
      status: "solved",
      solvedAt: now,
      leitnerBox: 0,
      nextReviewAt: now,
      lastReviewedAt: null,
      reviewCount: 0,
    });

    const loaded = await findUserProblemById(user.id, entry.id);
    expect(loaded?.status).toBe("solved");
    expect(loaded?.leitnerBox).toBe(0);
    expect(loaded?.nextReviewAt).not.toBeNull();
  });

  it("lists due reviews and records review outcomes", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({
      userId: user.id,
      status: "solved",
    });

    const past = new Date(Date.now() - 60_000);
    await updateUserProblem(user.id, entry.id, {
      status: "solved",
      leitnerBox: 1,
      nextReviewAt: past,
      reviewCount: 0,
    });

    const due = await listDueReviews(user.id, new Date());
    expect(due.some((row) => row.id === entry.id)).toBe(true);

    const result = applyReview(
      {
        leitnerBox: 1,
        nextReviewAt: past,
        lastReviewedAt: null,
        reviewCount: 0,
      },
      "pass",
    );

    await updateUserProblem(user.id, entry.id, {
      leitnerBox: result.leitnerBox,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: result.lastReviewedAt,
      reviewCount: result.reviewCount,
    });

    await createReviewLog({
      userProblemId: entry.id,
      outcome: "pass",
      fromBox: result.fromBox,
      toBox: result.toBox,
    });

    const reloaded = await findUserProblemById(user.id, entry.id);
    expect(reloaded?.leitnerBox).toBe(2);
    expect(reloaded?.reviewLogs).toHaveLength(1);
    expect(reloaded?.reviewLogs[0]?.outcome).toBe("pass");
  });

  it("lists solved problems for kanban by leitner box", async () => {
    const user = await createTestUser();
    const first = await seedJournalEntry({ userId: user.id, status: "solved" });
    const second = await seedJournalEntry({ userId: user.id, status: "solved" });

    await updateUserProblem(user.id, first.entry.id, {
      leitnerBox: 1,
      status: "solved",
    });
    await updateUserProblem(user.id, second.entry.id, {
      leitnerBox: 3,
      status: "solved",
    });

    const kanban = await listKanbanProblems(user.id);
    const ids = kanban.map((row) => row.id);
    expect(ids).toContain(first.entry.id);
    expect(ids).toContain(second.entry.id);
    expect(kanban.find((row) => row.id === first.entry.id)?.leitnerBox).toBe(1);
    expect(kanban.find((row) => row.id === second.entry.id)?.leitnerBox).toBe(3);
  });
});
