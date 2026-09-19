import TurndownService from "turndown";
import { normalizeLeetcodeDifficulty } from "@/lib/leetcode-difficulty";
import type { Difficulty } from "@/server/db/schema";

const GRAPHQL_URL = "https://leetcode.com/graphql";

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      translatedContent
      isPaidOnly
      difficulty
      topicTags {
        name
        slug
      }
      companyTagStatsV2
    }
  }
`;

export interface LeetcodeTopicTag {
  name: string;
  slug: string;
}

export interface LeetcodeCompanyTag {
  name: string;
  slug: string;
  frequency: number;
}

export interface LeetcodeQuestion {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string | null;
  isPaidOnly: boolean;
  difficulty: Difficulty;
  topicTags: LeetcodeTopicTag[];
  companyTags: LeetcodeCompanyTag[];
}

export class LeetcodeFetchError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "NETWORK" | "PREMIUM" | "UNKNOWN",
  ) {
    super(message);
    this.name = "LeetcodeFetchError";
  }
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function parseCompanyTags(raw: string | null | undefined): LeetcodeCompanyTag[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as {
      three_months?: Array<{
        name: string;
        slug: string;
        timesEncountered?: number;
      }>;
      six_months?: Array<{
        name: string;
        slug: string;
        timesEncountered?: number;
      }>;
    };

    const combined = [
      ...(parsed.three_months ?? []),
      ...(parsed.six_months ?? []),
    ];

    const map = new Map<string, LeetcodeCompanyTag>();
    for (const tag of combined) {
      const existing = map.get(tag.slug);
      const frequency = tag.timesEncountered ?? 0;
      if (existing) {
        existing.frequency += frequency;
      } else {
        map.set(tag.slug, {
          name: tag.name,
          slug: tag.slug,
          frequency,
        });
      }
    }

    return [...map.values()].sort((a, b) => b.frequency - a.frequency);
  } catch {
    return [];
  }
}

function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) {
    return "";
  }

  try {
    return turndown.turndown(html);
  } catch {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

interface GraphQLResponse {
  data?: {
    question?: {
      questionId: string;
      questionFrontendId: string;
      title: string;
      titleSlug: string;
      content: string | null;
      translatedContent?: string | null;
      isPaidOnly: boolean;
      difficulty: string;
      topicTags: LeetcodeTopicTag[];
      companyTagStatsV2?: string | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

function buildLeetcodeHeaders(
  slug: string,
  credentials?: { session: string; csrf: string },
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Referer: `https://leetcode.com/problems/${slug}/`,
    Origin: "https://leetcode.com",
    "User-Agent":
      "Mozilla/5.0 (compatible; CodeJournal/1.0; +https://github.com/code-journal)",
  };

  if (credentials) {
    headers.Cookie = `LEETCODE_SESSION=${credentials.session}; csrftoken=${credentials.csrf}`;
    headers["x-csrftoken"] = credentials.csrf;
  }

  return headers;
}

export async function fetchLeetcodeQuestion(
  slug: string,
  credentials?: { session: string; csrf: string },
): Promise<LeetcodeQuestion> {
  let response: Response;
  try {
    response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: buildLeetcodeHeaders(slug, credentials),
      body: JSON.stringify({
        operationName: "questionData",
        variables: { titleSlug: slug },
        query: QUESTION_QUERY,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new LeetcodeFetchError("Failed to reach LeetCode", "NETWORK");
  }

  if (!response.ok) {
    throw new LeetcodeFetchError(
      `LeetCode responded with ${response.status}`,
      "NETWORK",
    );
  }

  let payload: GraphQLResponse;
  try {
    payload = (await response.json()) as GraphQLResponse;
  } catch {
    throw new LeetcodeFetchError("Invalid response from LeetCode", "UNKNOWN");
  }

  if (payload.errors?.length) {
    throw new LeetcodeFetchError(
      payload.errors[0]?.message ?? "LeetCode GraphQL error",
      "UNKNOWN",
    );
  }

  const question = payload.data?.question;

  if (!question) {
    throw new LeetcodeFetchError("Problem not found on LeetCode", "NOT_FOUND");
  }

  const content = question.content ?? question.translatedContent ?? null;

  if (question.isPaidOnly && !content) {
    throw new LeetcodeFetchError(
      "Premium-only problem requires manual entry",
      "PREMIUM",
    );
  }

  let difficulty: Difficulty;
  try {
    difficulty = normalizeLeetcodeDifficulty(question.difficulty);
  } catch {
    throw new LeetcodeFetchError(
      `Unsupported difficulty from LeetCode: ${question.difficulty}`,
      "UNKNOWN",
    );
  }

  return {
    questionId: question.questionId,
    questionFrontendId: question.questionFrontendId,
    title: question.title,
    titleSlug: question.titleSlug,
    content,
    isPaidOnly: question.isPaidOnly,
    difficulty,
    topicTags: question.topicTags ?? [],
    companyTags: parseCompanyTags(question.companyTagStatsV2),
  };
}

export function mapLeetcodeQuestionToProblemFields(question: LeetcodeQuestion) {
  return {
    slug: question.titleSlug,
    leetcodeFrontendId: question.questionFrontendId,
    title: question.title,
    difficulty: question.difficulty,
    descriptionMd: htmlToMarkdown(question.content),
    url: `https://leetcode.com/problems/${question.titleSlug}/`,
    source: "leetcode" as const,
    isPaidOnly: question.isPaidOnly,
    fetchedAt: new Date(),
    topics: question.topicTags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
    })),
    companies: question.companyTags,
  };
}

export async function verifyLeetcodeCredentials(credentials: {
  session: string;
  csrf: string;
}): Promise<boolean> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: buildLeetcodeHeaders("two-sum", credentials),
      body: JSON.stringify({
        operationName: "userStatus",
        variables: {},
        query: `query userStatus { userStatus { isSignedIn username } }`,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      data?: { userStatus?: { isSignedIn?: boolean } };
    };
    return payload.data?.userStatus?.isSignedIn === true;
  } catch {
    return false;
  }
}

export function problemNeedsLeetcodeEnrichment(problem: {
  descriptionMd: string;
  problemTopics: unknown[];
  source: string;
}): boolean {
  if (problem.source !== "leetcode") {
    return false;
  }
  return (
    !problem.descriptionMd.trim() || problem.problemTopics.length === 0
  );
}
