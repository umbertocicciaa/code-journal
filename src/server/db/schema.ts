import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);
export const problemSourceEnum = pgEnum("problem_source", ["leetcode", "manual"]);
export const userProblemStatusEnum = pgEnum("user_problem_status", [
  "attempting",
  "solved",
]);
export const reviewOutcomeEnum = pgEnum("review_outcome", ["pass", "fail"]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    username: text("username").notNull(),
    statsPublic: boolean("stats_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_email_idx").on(table.email),
    uniqueIndex("user_username_idx").on(table.username),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("session_token_idx").on(table.token)],
);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const problem = pgTable(
  "problem",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    leetcodeFrontendId: text("leetcode_frontend_id"),
    title: text("title").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    descriptionMd: text("description_md").notNull().default(""),
    url: text("url").notNull(),
    source: problemSourceEnum("source").notNull().default("leetcode"),
    isPaidOnly: boolean("is_paid_only").notNull().default(false),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("problem_slug_idx").on(table.slug)],
);

export const topic = pgTable(
  "topic",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("topic_slug_idx").on(table.slug)],
);

export const company = pgTable(
  "company",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("company_slug_idx").on(table.slug)],
);

export const problemTopic = pgTable(
  "problem_topic",
  {
    problemId: text("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topic.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.problemId, table.topicId] }),
    index("problem_topic_topic_idx").on(table.topicId),
  ],
);

export const problemCompany = pgTable(
  "problem_company",
  {
    problemId: text("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    frequency: integer("frequency"),
  },
  (table) => [
    primaryKey({ columns: [table.problemId, table.companyId] }),
    index("problem_company_company_idx").on(table.companyId),
  ],
);

export const userProblem = pgTable(
  "user_problem",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    status: userProblemStatusEnum("status").notNull().default("attempting"),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    notesMd: text("notes_md").notNull().default(""),
    leitnerBox: integer("leitner_box").notNull().default(0),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    reviewCount: integer("review_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_problem_user_problem_idx").on(
      table.userId,
      table.problemId,
    ),
    index("user_problem_user_idx").on(table.userId),
    index("user_problem_next_review_idx").on(table.nextReviewAt),
  ],
);

export const solution = pgTable(
  "solution",
  {
    id: text("id").primaryKey(),
    userProblemId: text("user_problem_id")
      .notNull()
      .references(() => userProblem.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    language: text("language").notNull().default("typescript"),
    bodyMd: text("body_md").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("solution_user_problem_idx").on(table.userProblemId)],
);

export const userTag = pgTable(
  "user_tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
  },
  (table) => [
    uniqueIndex("user_tag_user_name_idx").on(table.userId, table.name),
    index("user_tag_user_idx").on(table.userId),
  ],
);

export const userProblemTag = pgTable(
  "user_problem_tag",
  {
    userProblemId: text("user_problem_id")
      .notNull()
      .references(() => userProblem.id, { onDelete: "cascade" }),
    userTagId: text("user_tag_id")
      .notNull()
      .references(() => userTag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userProblemId, table.userTagId] }),
    index("user_problem_tag_tag_idx").on(table.userTagId),
  ],
);

export const reviewLog = pgTable(
  "review_log",
  {
    id: text("id").primaryKey(),
    userProblemId: text("user_problem_id")
      .notNull()
      .references(() => userProblem.id, { onDelete: "cascade" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    outcome: reviewOutcomeEnum("outcome").notNull(),
    fromBox: integer("from_box").notNull(),
    toBox: integer("to_box").notNull(),
  },
  (table) => [
    index("review_log_user_problem_idx").on(table.userProblemId),
    index("review_log_reviewed_at_idx").on(table.reviewedAt),
  ],
);

export const leetcodeCredential = pgTable(
  "leetcode_credential",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionEnc: text("session_enc").notNull(),
    csrfEnc: text("csrf_enc").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("leetcode_credential_user_idx").on(table.userId)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  userProblems: many(userProblem),
  userTags: many(userTag),
  leetcodeCredential: one(leetcodeCredential),
}));

export const problemRelations = relations(problem, ({ many }) => ({
  userProblems: many(userProblem),
  problemTopics: many(problemTopic),
  problemCompanies: many(problemCompany),
}));

export const userProblemRelations = relations(userProblem, ({ one, many }) => ({
  user: one(user, {
    fields: [userProblem.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [userProblem.problemId],
    references: [problem.id],
  }),
  solutions: many(solution),
  reviewLogs: many(reviewLog),
  userProblemTags: many(userProblemTag),
}));

export const solutionRelations = relations(solution, ({ one }) => ({
  userProblem: one(userProblem, {
    fields: [solution.userProblemId],
    references: [userProblem.id],
  }),
}));

export const topicRelations = relations(topic, ({ many }) => ({
  problemTopics: many(problemTopic),
}));

export const companyRelations = relations(company, ({ many }) => ({
  problemCompanies: many(problemCompany),
}));

export const problemTopicRelations = relations(problemTopic, ({ one }) => ({
  problem: one(problem, {
    fields: [problemTopic.problemId],
    references: [problem.id],
  }),
  topic: one(topic, {
    fields: [problemTopic.topicId],
    references: [topic.id],
  }),
}));

export const problemCompanyRelations = relations(problemCompany, ({ one }) => ({
  problem: one(problem, {
    fields: [problemCompany.problemId],
    references: [problem.id],
  }),
  company: one(company, {
    fields: [problemCompany.companyId],
    references: [company.id],
  }),
}));

export const userTagRelations = relations(userTag, ({ one, many }) => ({
  user: one(user, {
    fields: [userTag.userId],
    references: [user.id],
  }),
  userProblemTags: many(userProblemTag),
}));

export const userProblemTagRelations = relations(userProblemTag, ({ one }) => ({
  userProblem: one(userProblem, {
    fields: [userProblemTag.userProblemId],
    references: [userProblem.id],
  }),
  userTag: one(userTag, {
    fields: [userProblemTag.userTagId],
    references: [userTag.id],
  }),
}));

export const reviewLogRelations = relations(reviewLog, ({ one }) => ({
  userProblem: one(userProblem, {
    fields: [reviewLog.userProblemId],
    references: [userProblem.id],
  }),
}));

export type Difficulty = (typeof difficultyEnum.enumValues)[number];
export type ProblemSource = (typeof problemSourceEnum.enumValues)[number];
export type UserProblemStatus = (typeof userProblemStatusEnum.enumValues)[number];
export type ReviewOutcome = (typeof reviewOutcomeEnum.enumValues)[number];
