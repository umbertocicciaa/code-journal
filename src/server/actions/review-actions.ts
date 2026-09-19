"use server";

import { revalidatePath } from "next/cache";
import {
  applyReview,
  DEFAULT_LEITNER_INTERVALS_DAYS,
  MAX_LEITNER_BOX,
} from "@/lib/leitner";
import {
  createReviewLog,
  findUserProblemById,
  listDueReviews,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";
import { kanbanMoveSchema, reviewSchema } from "@/server/validation";

export async function submitReviewAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid review" } as const;
    }

    const entry = await findUserProblemById(
      session.user.id,
      parsed.data.userProblemId,
    );
    if (!entry || entry.status !== "solved") {
      return { success: false, error: "Problem not found" } as const;
    }

    const result = applyReview(
      {
        leitnerBox: entry.leitnerBox,
        nextReviewAt: entry.nextReviewAt,
        lastReviewedAt: entry.lastReviewedAt,
        reviewCount: entry.reviewCount,
      },
      parsed.data.outcome,
    );

    await updateUserProblem(session.user.id, entry.id, {
      leitnerBox: result.leitnerBox,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: result.lastReviewedAt,
      reviewCount: result.reviewCount,
    });

    await createReviewLog({
      userProblemId: entry.id,
      outcome: parsed.data.outcome,
      fromBox: result.fromBox,
      toBox: result.toBox,
    });

    revalidatePath("/review");
    revalidatePath("/kanban");
    revalidatePath("/stats");
    return { success: true } as const;
  } catch (error) {
    console.error("submitReviewAction failed:", error);
    return { success: false, error: "Unable to submit review." } as const;
  }
}

export async function moveKanbanCardAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = kanbanMoveSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid move" } as const;
    }

    const entry = await findUserProblemById(
      session.user.id,
      parsed.data.userProblemId,
    );
    if (!entry || entry.status !== "solved") {
      return { success: false, error: "Problem not found" } as const;
    }

    const fromBox = entry.leitnerBox;
    const toBox = parsed.data.toBox;
    const outcome = toBox >= fromBox ? "pass" : "fail";
    const now = new Date();
    const intervalIndex = Math.min(
      Math.max(toBox - 1, 0),
      DEFAULT_LEITNER_INTERVALS_DAYS.length - 1,
    );
    const intervalDays =
      DEFAULT_LEITNER_INTERVALS_DAYS[intervalIndex] ??
      DEFAULT_LEITNER_INTERVALS_DAYS[DEFAULT_LEITNER_INTERVALS_DAYS.length - 1];
    const nextReviewAt =
      toBox > MAX_LEITNER_BOX
        ? null
        : new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    await updateUserProblem(session.user.id, entry.id, {
      leitnerBox: toBox,
      nextReviewAt,
      lastReviewedAt: now,
      reviewCount: entry.reviewCount + 1,
    });

    await createReviewLog({
      userProblemId: entry.id,
      outcome,
      fromBox,
      toBox,
    });

    revalidatePath("/kanban");
    revalidatePath("/review");
    revalidatePath("/stats");
    return { success: true } as const;
  } catch (error) {
    console.error("moveKanbanCardAction failed:", error);
    return { success: false, error: "Unable to move card." } as const;
  }
}

export async function getDueReviewsAction() {
  try {
    const session = await requireSession();
    return listDueReviews(session.user.id);
  } catch (error) {
    console.error("getDueReviewsAction failed:", error);
    return [];
  }
}
