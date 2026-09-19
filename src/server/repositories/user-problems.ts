import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { initializeLeitnerOnSolve } from "@/lib/leitner";
import { db } from "@/server/db/client";
import {
  problem,
  reviewLog,
  solution,
  userProblem,
  userProblemTag,
  userTag,
  type Difficulty,
  type ReviewOutcome,
  type UserProblemStatus,
} from "@/server/db/schema";

export interface UserProblemFilters {
  query?: string;
  difficulty?: Difficulty;
  status?: UserProblemStatus;
  tagId?: string;
  leitnerBox?: number;
}

export async function findUserProblemById(userId: string, id: string) {
  return db.query.userProblem.findFirst({
    where: and(eq(userProblem.id, id), eq(userProblem.userId, userId)),
    with: {
      problem: {
        with: {
          problemTopics: { with: { topic: true } },
          problemCompanies: { with: { company: true } },
        },
      },
      solutions: {
        orderBy: [desc(solution.updatedAt)],
      },
      userProblemTags: {
        with: { userTag: true },
      },
      reviewLogs: {
        orderBy: [desc(reviewLog.reviewedAt)],
        limit: 20,
      },
    },
  });
}

export async function findUserProblemByProblemId(
  userId: string,
  problemId: string,
) {
  return db.query.userProblem.findFirst({
    where: and(
      eq(userProblem.userId, userId),
      eq(userProblem.problemId, problemId),
    ),
  });
}

export async function listUserProblems(
  userId: string,
  filters: UserProblemFilters = {},
) {
  const conditions = [eq(userProblem.userId, userId)];

  if (filters.status) {
    conditions.push(eq(userProblem.status, filters.status));
  }
  if (filters.leitnerBox !== undefined) {
    conditions.push(eq(userProblem.leitnerBox, filters.leitnerBox));
  }

  const rows = await db.query.userProblem.findMany({
    where: and(...conditions),
    with: {
      problem: {
        with: {
          problemTopics: { with: { topic: true } },
          problemCompanies: { with: { company: true } },
        },
      },
      userProblemTags: {
        with: { userTag: true },
      },
    },
    orderBy: [desc(userProblem.updatedAt)],
  });

  return rows.filter((row) => {
    if (filters.difficulty && row.problem.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matches =
        row.problem.title.toLowerCase().includes(q) ||
        row.problem.slug.toLowerCase().includes(q);
      if (!matches) {
        return false;
      }
    }
    if (filters.tagId) {
      const hasTag = row.userProblemTags.some(
        (tag) => tag.userTagId === filters.tagId,
      );
      if (!hasTag) {
        return false;
      }
    }
    return true;
  });
}

export async function createUserProblem(input: {
  userId: string;
  problemId: string;
  status?: UserProblemStatus;
  notesMd?: string;
}) {
  const existing = await findUserProblemByProblemId(
    input.userId,
    input.problemId,
  );
  if (existing) {
    return existing;
  }

  const id = nanoid();
  const now = new Date();
  const leitner =
    input.status === "solved" ? initializeLeitnerOnSolve(now) : null;

  await db.insert(userProblem).values({
    id,
    userId: input.userId,
    problemId: input.problemId,
    status: input.status ?? "attempting",
    notesMd: input.notesMd ?? "",
    solvedAt: input.status === "solved" ? now : null,
    leitnerBox: leitner?.leitnerBox ?? 0,
    nextReviewAt: leitner?.nextReviewAt ?? null,
    lastReviewedAt: leitner?.lastReviewedAt ?? null,
    reviewCount: leitner?.reviewCount ?? 0,
  });

  return findUserProblemById(input.userId, id);
}

export async function updateUserProblem(
  userId: string,
  id: string,
  input: {
    status?: UserProblemStatus;
    notesMd?: string;
    leitnerBox?: number;
    nextReviewAt?: Date | null;
    lastReviewedAt?: Date | null;
    reviewCount?: number;
    solvedAt?: Date | null;
  },
) {
  await db
    .update(userProblem)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(userProblem.id, id), eq(userProblem.userId, userId)));

  return findUserProblemById(userId, id);
}

export async function deleteUserProblem(userId: string, id: string) {
  await db
    .delete(userProblem)
    .where(and(eq(userProblem.id, id), eq(userProblem.userId, userId)));
}

export async function listDueReviews(userId: string, now = new Date()) {
  return db.query.userProblem.findMany({
    where: and(
      eq(userProblem.userId, userId),
      eq(userProblem.status, "solved"),
      lte(userProblem.nextReviewAt, now),
    ),
    with: {
      problem: {
        with: {
          problemTopics: { with: { topic: true } },
          problemCompanies: { with: { company: true } },
        },
      },
      solutions: {
        orderBy: [desc(solution.updatedAt)],
      },
    },
    orderBy: [asc(userProblem.nextReviewAt)],
  });
}

export async function listKanbanProblems(userId: string) {
  return db.query.userProblem.findMany({
    where: and(
      eq(userProblem.userId, userId),
      eq(userProblem.status, "solved"),
    ),
    with: {
      problem: true,
      userProblemTags: { with: { userTag: true } },
    },
    orderBy: [asc(userProblem.leitnerBox), desc(userProblem.updatedAt)],
  });
}

export async function createReviewLog(input: {
  userProblemId: string;
  outcome: ReviewOutcome;
  fromBox: number;
  toBox: number;
  reviewedAt?: Date;
}) {
  const id = nanoid();
  await db.insert(reviewLog).values({
    id,
    userProblemId: input.userProblemId,
    outcome: input.outcome,
    fromBox: input.fromBox,
    toBox: input.toBox,
    reviewedAt: input.reviewedAt ?? new Date(),
  });
  return id;
}

export async function createSolution(input: {
  userProblemId: string;
  title: string;
  language: string;
  bodyMd: string;
}) {
  const id = nanoid();
  await db.insert(solution).values({
    id,
    userProblemId: input.userProblemId,
    title: input.title,
    language: input.language,
    bodyMd: input.bodyMd,
  });
  return db.query.solution.findFirst({ where: eq(solution.id, id) });
}

export async function updateSolution(
  userId: string,
  solutionId: string,
  input: { title?: string; language?: string; bodyMd?: string },
) {
  const owned = await db
    .select({ id: solution.id })
    .from(solution)
    .innerJoin(userProblem, eq(solution.userProblemId, userProblem.id))
    .where(and(eq(solution.id, solutionId), eq(userProblem.userId, userId)))
    .limit(1);

  if (owned.length === 0) {
    return null;
  }

  await db
    .update(solution)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(solution.id, solutionId));

  return db.query.solution.findFirst({ where: eq(solution.id, solutionId) });
}

export async function deleteSolution(userId: string, solutionId: string) {
  const owned = await db
    .select({ id: solution.id })
    .from(solution)
    .innerJoin(userProblem, eq(solution.userProblemId, userProblem.id))
    .where(and(eq(solution.id, solutionId), eq(userProblem.userId, userId)))
    .limit(1);

  if (owned.length === 0) {
    return false;
  }

  await db.delete(solution).where(eq(solution.id, solutionId));
  return true;
}

export async function listUserTags(userId: string) {
  return db.query.userTag.findMany({
    where: eq(userTag.userId, userId),
    orderBy: [asc(userTag.name)],
  });
}

export async function createUserTag(input: {
  userId: string;
  name: string;
  color?: string;
}) {
  const id = nanoid();
  await db.insert(userTag).values({
    id,
    userId: input.userId,
    name: input.name,
    color: input.color ?? "#6366f1",
  });
  return db.query.userTag.findFirst({ where: eq(userTag.id, id) });
}

export async function deleteUserTag(userId: string, tagId: string) {
  await db
    .delete(userTag)
    .where(and(eq(userTag.id, tagId), eq(userTag.userId, userId)));
}

export async function setUserProblemTags(
  userId: string,
  userProblemId: string,
  tagIds: string[],
) {
  const owned = await findUserProblemById(userId, userProblemId);
  if (!owned) {
    return null;
  }

  const validTags = await db.query.userTag.findMany({
    where: and(eq(userTag.userId, userId), inArray(userTag.id, tagIds)),
  });

  await db
    .delete(userProblemTag)
    .where(eq(userProblemTag.userProblemId, userProblemId));

  if (validTags.length > 0) {
    await db.insert(userProblemTag).values(
      validTags.map((tag) => ({
        userProblemId,
        userTagId: tag.id,
      })),
    );
  }

  return findUserProblemById(userId, userProblemId);
}

export async function countUserProblemsByBox(userId: string) {
  return db
    .select({
      leitnerBox: userProblem.leitnerBox,
      count: sql<number>`count(*)::int`,
    })
    .from(userProblem)
    .where(and(eq(userProblem.userId, userId), eq(userProblem.status, "solved")))
    .groupBy(userProblem.leitnerBox);
}

export async function countUserProblemsByDifficulty(userId: string) {
  return db
    .select({
      difficulty: problem.difficulty,
      count: sql<number>`count(*)::int`,
    })
    .from(userProblem)
    .innerJoin(problem, eq(userProblem.problemId, problem.id))
    .where(eq(userProblem.userId, userId))
    .groupBy(problem.difficulty);
}

export async function countUserProblemsByTopic(userId: string) {
  return db.execute<{ name: string; count: number }>(sql`
    select t.name as name, count(*)::int as count
    from user_problem up
    inner join problem_topic pt on pt.problem_id = up.problem_id
    inner join topic t on t.id = pt.topic_id
    where up.user_id = ${userId}
    group by t.name
    order by count desc
    limit 10
  `);
}

export type HeatmapActivityType = "solved" | "reviewed" | "solution";

export interface HeatmapDayActivity {
  userProblemId: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  activities: HeatmapActivityType[];
}

export async function getUserActivityForDate(userId: string, date: string) {
  const rows = await db.execute<{
    userProblemId: string;
    title: string;
    slug: string;
    difficulty: Difficulty;
    activityType: HeatmapActivityType;
  }>(sql`
    with day_activity as (
      select up.id as user_problem_id, 'solved'::text as activity_type
      from user_problem up
      where up.user_id = ${userId}
        and up.solved_at is not null
        and date_trunc('day', up.solved_at)::date = ${date}::date
      union all
      select up.id, 'reviewed'
      from review_log rl
      inner join user_problem up on up.id = rl.user_problem_id
      where up.user_id = ${userId}
        and date_trunc('day', rl.reviewed_at)::date = ${date}::date
      union all
      select up.id, 'solution'
      from solution s
      inner join user_problem up on up.id = s.user_problem_id
      where up.user_id = ${userId}
        and date_trunc('day', s.created_at)::date = ${date}::date
    )
    select up.id as "userProblemId",
           p.title,
           p.slug,
           p.difficulty,
           da.activity_type as "activityType"
    from day_activity da
    inner join user_problem up on up.id = da.user_problem_id
    inner join problem p on p.id = up.problem_id
    order by p.title, da.activity_type
  `);

  const grouped = new Map<string, HeatmapDayActivity>();
  for (const row of rows) {
    const existing = grouped.get(row.userProblemId);
    if (existing) {
      if (!existing.activities.includes(row.activityType)) {
        existing.activities.push(row.activityType);
      }
      continue;
    }
    grouped.set(row.userProblemId, {
      userProblemId: row.userProblemId,
      title: row.title,
      slug: row.slug,
      difficulty: row.difficulty,
      activities: [row.activityType],
    });
  }

  return Array.from(grouped.values());
}

export async function getUserActivityByDay(userId: string, days = 365) {
  const dayOffset = days - 1;
  return db.execute<{ date: string; count: number }>(sql`
    with activity as (
      select date_trunc('day', up.solved_at)::date as day
      from user_problem up
      where up.user_id = ${userId} and up.solved_at is not null
      union all
      select date_trunc('day', rl.reviewed_at)::date as day
      from review_log rl
      inner join user_problem up on up.id = rl.user_problem_id
      where up.user_id = ${userId}
      union all
      select date_trunc('day', s.created_at)::date as day
      from solution s
      inner join user_problem up on up.id = s.user_problem_id
      where up.user_id = ${userId}
    )
    select to_char(day, 'YYYY-MM-DD') as date, count(*)::int as count
    from activity
    where day >= (current_date - ${dayOffset}::integer)
    group by day
    order by day
  `);
}

export async function getSolvedOverTime(userId: string, days = 90) {
  const dayOffset = days - 1;
  return db.execute<{ date: string; count: number }>(sql`
    select to_char(date_trunc('day', up.solved_at), 'YYYY-MM-DD') as date,
           count(*)::int as count
    from user_problem up
    where up.user_id = ${userId}
      and up.solved_at is not null
      and up.solved_at >= (current_date - ${dayOffset}::integer)
    group by date_trunc('day', up.solved_at)
    order by date_trunc('day', up.solved_at)
  `);
}

export async function getReviewAccuracy(userId: string) {
  const rows = await db
    .select({
      outcome: reviewLog.outcome,
      count: sql<number>`count(*)::int`,
    })
    .from(reviewLog)
    .innerJoin(userProblem, eq(reviewLog.userProblemId, userProblem.id))
    .where(eq(userProblem.userId, userId))
    .groupBy(reviewLog.outcome);

  const pass = rows.find((row) => row.outcome === "pass")?.count ?? 0;
  const fail = rows.find((row) => row.outcome === "fail")?.count ?? 0;
  const total = pass + fail;
  return {
    pass,
    fail,
    total,
    accuracy: total > 0 ? pass / total : 0,
  };
}

export async function countUserProblems(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProblem)
    .where(eq(userProblem.userId, userId));
  return rows[0]?.count ?? 0;
}

export async function countSolvedProblems(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProblem)
    .where(
      and(eq(userProblem.userId, userId), eq(userProblem.status, "solved")),
    );
  return rows[0]?.count ?? 0;
}

export async function searchUserProblems(userId: string, query: string) {
  const rows = await db.query.userProblem.findMany({
    where: eq(userProblem.userId, userId),
    with: { problem: true },
    limit: 100,
  });

  const normalized = query.toLowerCase();
  return rows
    .filter(
      (row) =>
        row.problem.title.toLowerCase().includes(normalized) ||
        row.problem.slug.toLowerCase().includes(normalized),
    )
    .slice(0, 20);
}
