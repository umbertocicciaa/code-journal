import { normalizeLeetcodeDifficulty } from "@/lib/leetcode-difficulty";
import { buildNeetcodeUrl } from "@/lib/leetcode-url";
import { slugify } from "@/lib/utils";
import type { Difficulty } from "@/server/db/schema";

const METADATA_URL =
  "https://neetcode.io/api/getProblemMetadataFunctionHttp";
const CALLABLE_URL = "https://neetcode.io/api/callableFunctionHttp";

/** Public Firebase Web API key from the NeetCode frontend bundle. */
const DEFAULT_NEETCODE_FIREBASE_API_KEY = "AIzaSyD4emZpWF1MIsu6Z8O6yaMMcPxJ2Z38L8g";

export interface NeetcodeCompanyTag {
  name: string;
  slug: string;
  frequency: number;
}

export interface NeetcodeProblemMetadata {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  free: boolean;
  topics: string[];
  company_tags?: Record<string, { timesEncountered?: number }> | null;
  message?: string;
}

export class NeetcodeFetchError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "NETWORK" | "PREMIUM" | "UNKNOWN",
  ) {
    super(message);
    this.name = "NeetcodeFetchError";
  }
}

function neetcodeFirebaseApiKey(): string {
  return (
    process.env.NEETCODE_FIREBASE_API_KEY?.trim() ||
    DEFAULT_NEETCODE_FIREBASE_API_KEY
  );
}

function parseNeetcodeCompanyTags(
  raw: NeetcodeProblemMetadata["company_tags"],
): NeetcodeCompanyTag[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw)
    .map(([slug, stats]) => ({
      slug,
      name: slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      frequency: stats?.timesEncountered ?? 0,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

interface MetadataResponse {
  data?: NeetcodeProblemMetadata;
  error?: { message?: string; status?: string };
}

export async function mintNeetcodeAccessToken(
  refreshToken: string,
): Promise<string> {
  const apiKey = neetcodeFirebaseApiKey();
  let response: Response;
  try {
    response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
  } catch {
    throw new NeetcodeFetchError("Failed to reach NeetCode auth", "NETWORK");
  }

  if (!response.ok) {
    throw new NeetcodeFetchError("Invalid NeetCode refresh token", "UNKNOWN");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new NeetcodeFetchError("Invalid NeetCode refresh token", "UNKNOWN");
  }

  return payload.access_token;
}

async function neetcodeSessionCookie(refreshToken: string): Promise<string> {
  try {
    return await mintNeetcodeAccessToken(refreshToken);
  } catch {
    return refreshToken;
  }
}

export async function fetchNeetcodeProblemMetadata(
  slug: string,
  credentials?: { refreshToken: string },
): Promise<NeetcodeProblemMetadata> {
  const body: { data: { problemId: string; sessionCookie?: string } } = {
    data: { problemId: slug },
  };

  if (credentials?.refreshToken) {
    body.data.sessionCookie = await neetcodeSessionCookie(
      credentials.refreshToken,
    );
  }

  let response: Response;
  try {
    response = await fetch(METADATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://neetcode.io",
        Referer: `https://neetcode.io/problems/${slug}/`,
        "User-Agent":
          "Mozilla/5.0 (compatible; CodeJournal/1.0; +https://github.com/code-journal)",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new NeetcodeFetchError("Failed to reach NeetCode", "NETWORK");
  }

  if (!response.ok) {
    throw new NeetcodeFetchError(
      `NeetCode responded with ${response.status}`,
      "NETWORK",
    );
  }

  let payload: MetadataResponse;
  try {
    payload = (await response.json()) as MetadataResponse;
  } catch {
    throw new NeetcodeFetchError("Invalid response from NeetCode", "UNKNOWN");
  }

  if (payload.error) {
    const status = payload.error.status?.toUpperCase() ?? "";
    if (status.includes("NOT_FOUND")) {
      throw new NeetcodeFetchError("Problem not found on NeetCode", "NOT_FOUND");
    }
    throw new NeetcodeFetchError(
      payload.error.message ?? "NeetCode API error",
      "UNKNOWN",
    );
  }

  const metadata = payload.data;
  if (!metadata?.id) {
    throw new NeetcodeFetchError("Problem not found on NeetCode", "NOT_FOUND");
  }

  if (
    !metadata.free &&
    metadata.message?.toLowerCase().includes("pro member") &&
    !metadata.description?.trim()
  ) {
    throw new NeetcodeFetchError(
      "Pro-only problem requires NeetCode credentials or manual entry",
      "PREMIUM",
    );
  }

  return metadata;
}

export function mapNeetcodeMetadataToProblemFields(
  metadata: NeetcodeProblemMetadata,
) {
  let difficulty: Difficulty;
  try {
    difficulty = normalizeLeetcodeDifficulty(metadata.difficulty);
  } catch {
    throw new NeetcodeFetchError(
      `Unsupported difficulty from NeetCode: ${metadata.difficulty}`,
      "UNKNOWN",
    );
  }

  const slug = metadata.id;

  return {
    slug,
    leetcodeFrontendId: null,
    title: metadata.name,
    difficulty,
    descriptionMd: metadata.description ?? "",
    url: buildNeetcodeUrl(slug),
    source: "neetcode" as const,
    isPaidOnly: !metadata.free,
    fetchedAt: new Date(),
    topics: (metadata.topics ?? []).map((name) => ({
      slug: slugify(name),
      name,
    })),
    companies: parseNeetcodeCompanyTags(metadata.company_tags),
  };
}

export async function verifyNeetcodeCredentials(refreshToken: string): Promise<boolean> {
  const sessionCookie = await neetcodeSessionCookie(refreshToken);

  try {
    const response = await fetch(CALLABLE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://neetcode.io",
      },
      body: JSON.stringify({
        data: {
          functionId: "getUserInfo",
          sessionCookie,
        },
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      data?: Record<string, unknown>;
      error?: { status?: string };
    };

    return Boolean(payload.data) && !payload.error;
  } catch {
    return false;
  }
}

export function problemNeedsNeetcodeEnrichment(problem: {
  descriptionMd: string;
  problemTopics: unknown[];
  source: string;
  isPaidOnly: boolean;
}): boolean {
  if (problem.source !== "neetcode") {
    return false;
  }

  return (
    !problem.descriptionMd.trim() ||
    problem.problemTopics.length === 0 ||
    problem.isPaidOnly
  );
}
