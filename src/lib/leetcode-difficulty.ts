import type { Difficulty } from "@/server/db/schema";

export function normalizeLeetcodeDifficulty(value: string): Difficulty {
  const normalized = value.trim().toUpperCase();
  switch (normalized) {
    case "EASY":
      return "EASY";
    case "MEDIUM":
      return "MEDIUM";
    case "HARD":
      return "HARD";
    default:
      throw new Error(`Unsupported difficulty: ${value}`);
  }
}

export function parseTopicsInput(
  input: string,
): Array<{ slug: string; name: string }> {
  return input
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
}
