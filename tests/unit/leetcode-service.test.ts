import { describe, expect, it } from "vitest";
import { mapLeetcodeQuestionToProblemFields } from "@/server/services/leetcode";

describe("leetcode service mapper", () => {
  it("maps GraphQL question fields to problem input", () => {
    const mapped = mapLeetcodeQuestionToProblemFields({
      questionId: "1",
      questionFrontendId: "1",
      title: "Two Sum",
      titleSlug: "two-sum",
      content: "<p>Given an array...</p>",
      isPaidOnly: false,
      difficulty: "EASY",
      topicTags: [{ name: "Array", slug: "array" }],
      companyTags: [{ name: "Google", slug: "google", frequency: 100 }],
    });

    expect(mapped.slug).toBe("two-sum");
    expect(mapped.title).toBe("Two Sum");
    expect(mapped.descriptionMd).toContain("Given an array");
    expect(mapped.topics).toEqual([{ slug: "array", name: "Array" }]);
    expect(mapped.companies[0]?.slug).toBe("google");
  });
});
