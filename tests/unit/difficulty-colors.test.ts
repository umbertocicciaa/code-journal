import { describe, expect, it } from "vitest";
import { difficultyBadgeVariant } from "@/components/ui/badge";
import { difficultyColors } from "@/components/ui/difficulty-colors";

describe("difficulty badge", () => {
  it.each([
    ["EASY", "easy"],
    ["MEDIUM", "medium"],
    ["HARD", "hard"],
  ] as const)("maps %s difficulty to the shared badge variant", (difficulty, variant) => {
    expect(difficultyBadgeVariant(difficulty)).toBe(variant);
  });

  it("uses one shared palette for all difficulty chart colors", () => {
    expect(difficultyColors).toEqual({
      EASY: "var(--difficulty-easy)",
      MEDIUM: "var(--difficulty-medium)",
      HARD: "var(--difficulty-hard)",
    });
    expect(new Set(Object.values(difficultyColors)).size).toBe(3);
  });
});
