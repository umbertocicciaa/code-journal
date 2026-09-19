import { z } from "zod";

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const userProblemStatusSchema = z.enum(["attempting", "solved"]);
export const reviewOutcomeSchema = z.enum(["pass", "fail"]);

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, "Username may only contain letters, numbers, _ and -"),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const addProblemByUrlSchema = z.object({
  url: z.string().url(),
});

export const manualProblemSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  difficulty: difficultySchema,
  descriptionMd: z.string().max(100_000).default(""),
  url: z.string().url(),
  topics: z
    .array(z.object({ slug: z.string(), name: z.string() }))
    .default([]),
  companies: z
    .array(
      z.object({
        slug: z.string(),
        name: z.string(),
        frequency: z.number().int().optional(),
      }),
    )
    .default([]),
});

export const updateUserProblemSchema = z.object({
  status: userProblemStatusSchema.optional(),
  notesMd: z.string().max(100_000).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const solutionSchema = z.object({
  title: z.string().min(1).max(120),
  language: z.string().min(1).max(40),
  bodyMd: z.string().max(100_000),
});

export const reviewSchema = z.object({
  userProblemId: z.string().min(1),
  outcome: reviewOutcomeSchema,
});

export const kanbanMoveSchema = z.object({
  userProblemId: z.string().min(1),
  toBox: z.number().int().min(0).max(6),
});

export const userTagSchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
});

export const leetcodeCredentialSchema = z.object({
  session: z.string().min(10),
  csrf: z.string().min(10),
});

export const updateSettingsSchema = z.object({
  statsPublic: z.boolean().optional(),
  name: z.string().min(2).max(80).optional(),
});

export const journalFiltersSchema = z.object({
  query: z.string().optional(),
  difficulty: difficultySchema.optional(),
  status: userProblemStatusSchema.optional(),
  tagId: z.string().optional(),
});

export const activityDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});
