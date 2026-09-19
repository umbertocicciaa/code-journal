import { describe, expect, it } from "vitest";
import {
  createProblem,
  findProblemBySlug,
} from "@/server/repositories/problems";

describe("problem repository", () => {
  it("creates and finds a shared problem", async () => {
    const slug = `test-problem-${Date.now()}`;
    const created = await createProblem({
      slug,
      title: "Test Problem",
      difficulty: "EASY",
      descriptionMd: "Test description",
      url: `https://leetcode.com/problems/${slug}/`,
      source: "manual",
      topics: [{ slug: "array", name: "Array" }],
      companies: [{ slug: "google", name: "Google", frequency: 10 }],
    });

    expect(created?.slug).toBe(slug);
    const found = await findProblemBySlug(slug);
    expect(found?.problemTopics).toHaveLength(1);
    expect(found?.problemCompanies).toHaveLength(1);
  });
});
