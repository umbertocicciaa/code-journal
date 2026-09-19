import { describe, expect, it } from "vitest";
import {
  createProblem,
  findProblemBySlug,
  searchCompanies,
  searchTopics,
  updateProblem,
} from "@/server/repositories/problems";
import { uniqueSlug } from "./helpers";

describe("problem repository", () => {
  it("creates and finds a shared problem with relations", async () => {
    const slug = uniqueSlug("test-problem");
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

  it("updates problem metadata", async () => {
    const slug = uniqueSlug("update-problem");
    const created = await createProblem({
      slug,
      title: "Before",
      difficulty: "MEDIUM",
      descriptionMd: "Old",
      url: `https://leetcode.com/problems/${slug}/`,
      source: "manual",
    });

    const updated = await updateProblem(created!.id, {
      title: "After",
      descriptionMd: "New description",
      difficulty: "HARD",
    });

    expect(updated?.title).toBe("After");
    expect(updated?.descriptionMd).toBe("New description");
    expect(updated?.difficulty).toBe("HARD");
  });

  it("searches topics and companies", async () => {
    const slug = uniqueSlug("search-problem");
    await createProblem({
      slug,
      title: "Search Problem",
      difficulty: "EASY",
      descriptionMd: "",
      url: `https://leetcode.com/problems/${slug}/`,
      source: "manual",
      topics: [{ slug: "dynamic-programming", name: "Dynamic Programming" }],
      companies: [{ slug: "amazon", name: "Amazon" }],
    });

    const topics = await searchTopics("Dynamic");
    expect(topics.some((topic) => topic.slug === "dynamic-programming")).toBe(
      true,
    );

    const companies = await searchCompanies("Amazon");
    expect(companies.some((company) => company.slug === "amazon")).toBe(true);
  });
});
