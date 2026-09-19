import { describe, expect, it } from "vitest";
import { SOLUTION_LANGUAGE_IDS } from "@/lib/solution-languages";
import {
  createSolution,
  deleteSolution,
  findUserProblemById,
  updateSolution,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry } from "./helpers";

describe("solution repository", () => {
  it("creates solutions in supported languages", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: user.id });

    for (const language of SOLUTION_LANGUAGE_IDS) {
      const solution = await createSolution({
        userProblemId: entry.id,
        title: `${language} solution`,
        language,
        bodyMd: `// ${language} code`,
      });
      expect(solution?.language).toBe(language);
    }

    const loaded = await findUserProblemById(user.id, entry.id);
    expect(loaded?.solutions).toHaveLength(SOLUTION_LANGUAGE_IDS.length);
  });

  it("updates and deletes owned solutions", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: user.id });

    const created = await createSolution({
      userProblemId: entry.id,
      title: "Draft",
      language: "python",
      bodyMd: "pass",
    });
    expect(created).not.toBeNull();

    const updated = await updateSolution(user.id, created!.id, {
      title: "Final",
      language: "rust",
      bodyMd: "fn main() {}",
    });
    expect(updated?.title).toBe("Final");
    expect(updated?.language).toBe("rust");

    const deleted = await deleteSolution(user.id, created!.id);
    expect(deleted).toBe(true);

    const reloaded = await findUserProblemById(user.id, entry.id);
    expect(reloaded?.solutions).toHaveLength(0);
  });

  it("does not allow cross-user solution changes", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: owner.id });

    const solution = await createSolution({
      userProblemId: entry.id,
      title: "Private",
      language: "cpp",
      bodyMd: "class Solution {};",
    });

    const updated = await updateSolution(other.id, solution!.id, {
      title: "Hacked",
    });
    expect(updated).toBeNull();

    const deleted = await deleteSolution(other.id, solution!.id);
    expect(deleted).toBe(false);
  });
});
