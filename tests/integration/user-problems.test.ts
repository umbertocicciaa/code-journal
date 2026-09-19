import { describe, expect, it } from "vitest";
import {
  createUserProblem,
  deleteUserProblem,
  listUserProblems,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { createProblem } from "@/server/repositories/problems";
import { createTestUser, seedJournalEntry, uniqueSlug } from "./helpers";

describe("user problem repository", () => {
  it("scopes journal entries to the user", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: user.id });

    await updateUserProblem(user.id, entry.id, {
      status: "solved",
      solvedAt: new Date(),
      leitnerBox: 1,
      nextReviewAt: new Date(),
    });

    const rows = await listUserProblems(user.id);
    expect(rows.some((row) => row.id === entry.id)).toBe(true);
    expect(rows.find((row) => row.id === entry.id)?.status).toBe("solved");
  });

  it("returns the existing entry when adding the same problem twice", async () => {
    const user = await createTestUser();
    const slug = uniqueSlug("duplicate");
    const problem = await createProblem({
      slug,
      title: "Duplicate Problem",
      difficulty: "EASY",
      descriptionMd: "",
      url: `https://leetcode.com/problems/${slug}/`,
      source: "manual",
    });

    const first = await createUserProblem({
      userId: user.id,
      problemId: problem!.id,
    });
    const second = await createUserProblem({
      userId: user.id,
      problemId: problem!.id,
    });

    expect(second?.id).toBe(first?.id);
    expect(await listUserProblems(user.id)).toHaveLength(1);
  });

  it("deletes a journal entry for the owner", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: user.id });

    await deleteUserProblem(user.id, entry.id);

    const rows = await listUserProblems(user.id);
    expect(rows.some((row) => row.id === entry.id)).toBe(false);
  });
});
