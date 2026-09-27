import { describe, expect, it } from "vitest";
import {
  mapNeetcodeMetadataToProblemFields,
  problemNeedsNeetcodeEnrichment,
} from "@/server/services/neetcode";

describe("neetcode service mapper", () => {
  it("maps NeetCode metadata to problem input", () => {
    const mapped = mapNeetcodeMetadataToProblemFields({
      id: "two-integer-sum",
      name: "Two Sum",
      description: "Given an array of integers...",
      difficulty: "Easy",
      free: true,
      topics: ["Array", "Hash Table"],
      company_tags: {
        google: { timesEncountered: 12 },
      },
    });

    expect(mapped.slug).toBe("two-integer-sum");
    expect(mapped.title).toBe("Two Sum");
    expect(mapped.source).toBe("neetcode");
    expect(mapped.difficulty).toBe("EASY");
    expect(mapped.url).toBe("https://neetcode.io/problems/two-integer-sum/");
    expect(mapped.topics).toEqual([
      { slug: "array", name: "Array" },
      { slug: "hash-table", name: "Hash Table" },
    ]);
    expect(mapped.companies[0]?.slug).toBe("google");
  });

  it("detects when a NeetCode problem needs enrichment", () => {
    expect(
      problemNeedsNeetcodeEnrichment({
        source: "neetcode",
        descriptionMd: "",
        problemTopics: [],
        isPaidOnly: false,
      }),
    ).toBe(true);

    expect(
      problemNeedsNeetcodeEnrichment({
        source: "leetcode",
        descriptionMd: "",
        problemTopics: [],
        isPaidOnly: false,
      }),
    ).toBe(false);
  });
});
