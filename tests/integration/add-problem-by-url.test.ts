import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { addProblemByUrlAction } from "@/server/actions/journal-actions";
import { db } from "@/server/db/client";
import { problem, userProblem } from "@/server/db/schema";
import { createTestUser } from "./helpers";

const { requireSession } = vi.hoisted(() => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/session", () => ({ requireSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("addProblemByUrlAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("creates a NeetCode problem from a NeetCode URL", async () => {
    const user = await createTestUser();
    requireSession.mockResolvedValue({ user: { id: user.id } });

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("getProblemMetadataFunctionHttp")) {
        return new Response(
          JSON.stringify({
            data: {
              id: "two-integer-sum",
              name: "Two Sum",
              description: "Given an array of integers...",
              difficulty: "Easy",
              free: true,
              topics: ["Array", "Hash Table"],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const formData = new FormData();
    formData.set(
      "url",
      "https://neetcode.io/problems/two-integer-sum?list=neetcode150",
    );

    const result = await addProblemByUrlAction(
      { success: false, error: "" },
      formData,
    );

    expect(result).toEqual({
      success: true,
      data: { userProblemId: expect.any(String) },
    });

    const persisted = await db.query.problem.findFirst({
      where: eq(problem.slug, "two-integer-sum"),
    });
    expect(persisted).toMatchObject({
      slug: "two-integer-sum",
      title: "Two Sum",
      source: "neetcode",
      url: "https://neetcode.io/problems/two-integer-sum/",
    });

    const journalEntry = await db.query.userProblem.findFirst({
      where: eq(userProblem.userId, user.id),
    });
    expect(journalEntry?.problemId).toBe(persisted?.id);
  });
});
