export type ProblemUrlSource = "leetcode" | "neetcode";

export interface ParsedProblemUrl {
  source: ProblemUrlSource;
  slug: string;
}

const LEETCODE_URL_PATTERN =
  /^https?:\/\/(?:www\.)?leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)\/?(?:.*)?$/i;

const NEETCODE_URL_PATTERN =
  /^https?:\/\/(?:www\.)?neetcode\.io\/problems\/([a-z0-9-]+)(?:\/question)?\/?(?:[?#].*)?$/i;

export function parseLeetcodeUrl(url: string): { slug: string } | null {
  const parsed = parseProblemUrl(url);
  if (!parsed || parsed.source !== "leetcode") {
    return null;
  }
  return { slug: parsed.slug };
}

export function parseNeetcodeUrl(url: string): { slug: string } | null {
  const parsed = parseProblemUrl(url);
  if (!parsed || parsed.source !== "neetcode") {
    return null;
  }
  return { slug: parsed.slug };
}

export function parseProblemUrl(url: string): ParsedProblemUrl | null {
  const trimmed = url.trim();
  const leetcodeMatch = trimmed.match(LEETCODE_URL_PATTERN);
  if (leetcodeMatch?.[1]) {
    return { source: "leetcode", slug: leetcodeMatch[1].toLowerCase() };
  }

  const neetcodeMatch = trimmed.match(NEETCODE_URL_PATTERN);
  if (neetcodeMatch?.[1]) {
    return { source: "neetcode", slug: neetcodeMatch[1].toLowerCase() };
  }

  return null;
}

export function buildLeetcodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

export function buildNeetcodeUrl(slug: string): string {
  return `https://neetcode.io/problems/${slug}/`;
}

export function buildProblemUrl(source: ProblemUrlSource, slug: string): string {
  switch (source) {
    case "leetcode":
      return buildLeetcodeUrl(slug);
    case "neetcode":
      return buildNeetcodeUrl(slug);
    default: {
      const exhaustive: never = source;
      return exhaustive;
    }
  }
}
