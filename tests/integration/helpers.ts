import { nanoid } from "nanoid";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { createProblem } from "@/server/repositories/problems";
import {
  createUserProblem,
  createUserTag,
} from "@/server/repositories/user-problems";

export function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${nanoid(6)}`;
}

export async function createTestUser(overrides?: {
  name?: string;
  username?: string;
  email?: string;
}) {
  const id = nanoid();
  const suffix = Date.now();
  const username = overrides?.username ?? `user_${suffix}_${nanoid(4)}`;
  const email = overrides?.email ?? `${username}@example.com`;

  await db.insert(user).values({
    id,
    name: overrides?.name ?? "Test User",
    email,
    username,
    statsPublic: true,
  });

  return { id, name: overrides?.name ?? "Test User", email, username };
}

export async function seedJournalEntry(input: {
  userId: string;
  slug?: string;
  title?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  status?: "attempting" | "solved";
  notesMd?: string;
  topics?: Array<{ slug: string; name: string }>;
  companies?: Array<{ slug: string; name: string; frequency?: number }>;
}) {
  const slug = input.slug ?? uniqueSlug("problem");
  const problem = await createProblem({
    slug,
    title: input.title ?? "Test Problem",
    difficulty: input.difficulty ?? "MEDIUM",
    descriptionMd: "Description",
    url: `https://leetcode.com/problems/${slug}/`,
    source: "manual",
    topics: input.topics ?? [{ slug: "array", name: "Array" }],
    companies: input.companies ?? [],
  });

  if (!problem) {
    throw new Error("Failed to create problem");
  }

  const entry = await createUserProblem({
    userId: input.userId,
    problemId: problem.id,
    status: input.status,
    notesMd: input.notesMd,
  });

  if (!entry) {
    throw new Error("Failed to create user problem");
  }

  return { problem, entry };
}

export async function seedUserTag(userId: string, name?: string, color?: string) {
  const tag = await createUserTag({
    userId,
    name: name ?? `Tag ${nanoid(4)}`,
    color: color ?? "#6366f1",
  });
  if (!tag) {
    throw new Error("Failed to create tag");
  }
  return tag;
}
