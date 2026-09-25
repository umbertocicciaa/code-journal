import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSession = vi.fn();
const updateSolution = vi.fn();

vi.mock("@/server/session", () => ({ requireSession }));
vi.mock("@/server/repositories/user-problems", () => ({
  createUserProblem: vi.fn(),
  createSolution: vi.fn(),
  deleteSolution: vi.fn(),
  deleteUserProblem: vi.fn(),
  findUserProblemById: vi.fn(),
  setUserProblemTags: vi.fn(),
  updateSolution,
  updateUserProblem: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateSolutionAction } from "@/server/actions/journal-actions";

describe("journal solution actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a solution for the authenticated owner", async () => {
    requireSession.mockResolvedValue({ user: { id: "owner-1" } });
    updateSolution.mockResolvedValue({
      id: "solution-1",
      userProblemId: "entry-1",
      title: "Updated",
      language: "rust",
      bodyMd: "fn main() {}",
    });

    const result = await updateSolutionAction("solution-1", {
      title: "Updated",
      language: "rust",
      bodyMd: "fn main() {}",
    });

    expect(result).toEqual({ success: true });
    expect(updateSolution).toHaveBeenCalledWith("owner-1", "solution-1", {
      title: "Updated",
      language: "rust",
      bodyMd: "fn main() {}",
    });
  });

  it("rejects invalid solution payloads before touching the repository", async () => {
    requireSession.mockResolvedValue({ user: { id: "owner-1" } });

    const result = await updateSolutionAction("solution-1", {
      title: "",
      language: "not-a-language",
      bodyMd: "",
    });

    expect(result).toEqual({ success: false, error: "Invalid solution" });
    expect(updateSolution).not.toHaveBeenCalled();
  });

  it("reports missing solutions without exposing ownership details", async () => {
    requireSession.mockResolvedValue({ user: { id: "owner-1" } });
    updateSolution.mockResolvedValue(null);

    const result = await updateSolutionAction("missing", {
      title: "Updated",
      language: "python",
      bodyMd: "print('ok')",
    });

    expect(result).toEqual({ success: false, error: "Solution not found" });
  });
});
