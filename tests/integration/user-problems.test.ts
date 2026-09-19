import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { createProblem } from "@/server/repositories/problems";
import {
  createUserProblem,
  listUserProblems,
  updateUserProblem,
} from "@/server/repositories/user-problems";

describe("user problem repository", () => {
  it("scopes journal entries to the user", async () => {
    const userId = nanoid();
    await db.insert(user).values({
      id: userId,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      username: `user_${Date.now()}`,
    });

    const slug = `journal-problem-${Date.now()}`;
    const problem = await createProblem({
      slug,
      title: "Journal Problem",
      difficulty: "MEDIUM",
      descriptionMd: "Notes",
      url: `https://leetcode.com/problems/${slug}/`,
      source: "manual",
    });

    const entry = await createUserProblem({
      userId,
      problemId: problem!.id,
      status: "attempting",
    });

    await updateUserProblem(userId, entry!.id, {
      status: "solved",
      solvedAt: new Date(),
      leitnerBox: 1,
      nextReviewAt: new Date(),
    });

    const rows = await listUserProblems(userId);
    expect(rows.some((row) => row.id === entry!.id)).toBe(true);
    expect(rows[0]?.status).toBe("solved");
  });
});
