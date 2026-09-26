import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { problem, solution } from "@/server/db/schema";
import { db } from "@/server/db/client";
import { createSolution } from "@/server/repositories/user-problems";
import {
  updateProblemDescriptionAction,
  updateSolutionAction,
} from "@/server/actions/journal-actions";
import { createTestUser, seedJournalEntry } from "./helpers";

const { requireSession } = vi.hoisted(() => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/session", () => ({ requireSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("journal solution actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates and persists a solution for the authenticated owner", async () => {
    const user = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: user.id });
    const created = await createSolution({
      userProblemId: entry.id,
      title: "Original",
      language: "python",
      bodyMd: "print('before')",
    });

    expect(created).not.toBeNull();
    requireSession.mockResolvedValue({ user: { id: user.id } });

    const result = await updateSolutionAction(created!.id, {
      title: "Updated",
      language: "rust",
      bodyMd: "fn main() {}",
    });

    expect(result).toEqual({ success: true });

    const persisted = await db.query.solution.findFirst({
      where: eq(solution.id, created!.id),
    });
    expect(persisted).toMatchObject({
      id: created!.id,
      userProblemId: entry.id,
      title: "Updated",
      language: "rust",
      bodyMd: "fn main() {}",
    });
  });

  it("rejects invalid solution payloads before touching the database", async () => {
    const user = await createTestUser();
    requireSession.mockResolvedValue({ user: { id: user.id } });

    const result = await updateSolutionAction("missing-solution", {
      title: "",
      language: "not-a-language",
      bodyMd: "",
    });

    expect(result).toEqual({ success: false, error: "Invalid solution" });

    const persisted = await db.query.solution.findFirst({
      where: eq(solution.id, "missing-solution"),
    });
    expect(persisted).toBeUndefined();
  });

  it("does not allow a different user to update the solution", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const { entry } = await seedJournalEntry({ userId: owner.id });
    const created = await createSolution({
      userProblemId: entry.id,
      title: "Private",
      language: "cpp",
      bodyMd: "class Solution {};",
    });

    expect(created).not.toBeNull();
    requireSession.mockResolvedValue({ user: { id: other.id } });

    const result = await updateSolutionAction(created!.id, {
      title: "Hacked",
      language: "rust",
      bodyMd: "fn main() {}",
    });

    expect(result).toEqual({ success: false, error: "Solution not found" });

    const persisted = await db.query.solution.findFirst({
      where: eq(solution.id, created!.id),
    });
    expect(persisted).toMatchObject({
      title: "Private",
      language: "cpp",
      bodyMd: "class Solution {};",
    });
  });
});

describe("journal problem description actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates and persists the description for the authenticated owner", async () => {
    const user = await createTestUser();
    const { problem: sharedProblem, entry } = await seedJournalEntry({
      userId: user.id,
    });
    requireSession.mockResolvedValue({ user: { id: user.id } });

    const result = await updateProblemDescriptionAction(entry.id, {
      descriptionMd: "## Updated\n\nNew statement.",
    });

    expect(result).toEqual({ success: true });

    const persisted = await db.query.problem.findFirst({
      where: eq(problem.id, sharedProblem.id),
    });
    expect(persisted?.descriptionMd).toBe("## Updated\n\nNew statement.");
    expect(persisted?.updatedBy).toBe(user.id);
  });

  it("rejects invalid description payloads before touching the database", async () => {
    const user = await createTestUser();
    const { problem: sharedProblem, entry } = await seedJournalEntry({
      userId: user.id,
    });
    requireSession.mockResolvedValue({ user: { id: user.id } });

    const result = await updateProblemDescriptionAction(entry.id, {
      descriptionMd: "x".repeat(100_001),
    });

    expect(result).toEqual({ success: false, error: "Invalid description" });

    const persisted = await db.query.problem.findFirst({
      where: eq(problem.id, sharedProblem.id),
    });
    expect(persisted?.descriptionMd).toBe("Description");
  });

  it("does not allow a different user to update the description", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const { problem: sharedProblem, entry } = await seedJournalEntry({
      userId: owner.id,
    });
    requireSession.mockResolvedValue({ user: { id: other.id } });

    const result = await updateProblemDescriptionAction(entry.id, {
      descriptionMd: "Hacked description",
    });

    expect(result).toEqual({ success: false, error: "Problem not found" });

    const persisted = await db.query.problem.findFirst({
      where: eq(problem.id, sharedProblem.id),
    });
    expect(persisted?.descriptionMd).toBe("Description");
  });
});
