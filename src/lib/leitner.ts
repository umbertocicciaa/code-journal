export const LEITNER_BOX_LABELS = [
  "New",
  "Box 1",
  "Box 2",
  "Box 3",
  "Box 4",
  "Box 5",
  "Mastered",
] as const;

export const DEFAULT_LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

export const MAX_LEITNER_BOX = 5;

export type LeitnerOutcome = "pass" | "fail";

export interface LeitnerEntry {
  leitnerBox: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  reviewCount: number;
}

export interface LeitnerReviewResult extends LeitnerEntry {
  fromBox: number;
  toBox: number;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getLeitnerBoxLabel(box: number): string {
  if (box <= 0) {
    return LEITNER_BOX_LABELS[0];
  }
  if (box > MAX_LEITNER_BOX) {
    return LEITNER_BOX_LABELS[LEITNER_BOX_LABELS.length - 1];
  }
  return LEITNER_BOX_LABELS[box] ?? LEITNER_BOX_LABELS[0];
}

export function applyReview(
  entry: LeitnerEntry,
  outcome: LeitnerOutcome,
  now: Date = new Date(),
  intervals: readonly number[] = DEFAULT_LEITNER_INTERVALS_DAYS,
): LeitnerReviewResult {
  const fromBox = entry.leitnerBox;
  let toBox = fromBox;

  if (outcome === "fail") {
    toBox = 1;
  } else if (fromBox <= 0) {
    toBox = 1;
  } else if (fromBox >= MAX_LEITNER_BOX) {
    toBox = MAX_LEITNER_BOX + 1;
  } else {
    toBox = fromBox + 1;
  }

  const intervalIndex = Math.min(Math.max(toBox - 1, 0), intervals.length - 1);
  const intervalDays = intervals[intervalIndex] ?? intervals[intervals.length - 1];

  const nextReviewAt =
    toBox > MAX_LEITNER_BOX ? null : addDays(now, intervalDays);

  return {
    leitnerBox: toBox,
    nextReviewAt,
    lastReviewedAt: now,
    reviewCount: entry.reviewCount + 1,
    fromBox,
    toBox,
  };
}

export function initializeLeitnerOnSolve(now: Date = new Date()): LeitnerEntry {
  return {
    leitnerBox: 0,
    nextReviewAt: now,
    lastReviewedAt: null,
    reviewCount: 0,
  };
}

export function toDateValue(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isReviewDue(
  nextReviewAt: Date | string | null,
  now: Date = new Date(),
): boolean {
  const dueAt = toDateValue(nextReviewAt);
  if (!dueAt) {
    return false;
  }
  return dueAt.getTime() <= now.getTime();
}
