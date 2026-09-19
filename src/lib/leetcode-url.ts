const LEETCODE_URL_PATTERN =
  /^https?:\/\/(?:www\.)?leetcode\.(?:com|cn)\/problems\/([a-z0-9-]+)\/?(?:.*)?$/i;

export function parseLeetcodeUrl(url: string): { slug: string } | null {
  const trimmed = url.trim();
  const match = trimmed.match(LEETCODE_URL_PATTERN);
  if (!match?.[1]) {
    return null;
  }
  return { slug: match[1].toLowerCase() };
}

export function buildLeetcodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}
