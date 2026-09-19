import { describe, expect, it } from "vitest";
import {
  normalizeLeetcodeDifficulty,
  parseTopicsInput,
} from "@/lib/leetcode-difficulty";

describe("leetcode difficulty", () => {
  it("normalizes LeetCode difficulty labels", () => {
    expect(normalizeLeetcodeDifficulty("Easy")).toBe("EASY");
    expect(normalizeLeetcodeDifficulty("Medium")).toBe("MEDIUM");
    expect(normalizeLeetcodeDifficulty("Hard")).toBe("HARD");
  });

  it("parses topic input", () => {
    expect(parseTopicsInput("Array, Hash Table")).toEqual([
      { name: "Array", slug: "array" },
      { name: "Hash Table", slug: "hash-table" },
    ]);
  });
});
