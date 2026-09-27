import { describe, expect, it } from "vitest";
import { journalFiltersSchema } from "@/server/validation";

describe("journalFiltersSchema", () => {
  it("accepts all supported filter fields", () => {
    const parsed = journalFiltersSchema.parse({
      query: "two sum",
      difficulty: "EASY",
      status: "solved",
      tagId: "tag_abc",
      topicId: "topic_xyz",
      companyId: "company_123",
    });

    expect(parsed).toEqual({
      query: "two sum",
      difficulty: "EASY",
      status: "solved",
      tagId: "tag_abc",
      topicId: "topic_xyz",
      companyId: "company_123",
    });
  });

  it("rejects invalid difficulty and status values", () => {
    expect(
      journalFiltersSchema.safeParse({ difficulty: "EXPERT" }).success,
    ).toBe(false);
    expect(
      journalFiltersSchema.safeParse({ status: "archived" }).success,
    ).toBe(false);
  });

  it("allows an empty filter object", () => {
    expect(journalFiltersSchema.parse({})).toEqual({});
  });
});
