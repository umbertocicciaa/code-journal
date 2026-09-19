import { describe, expect, it } from "vitest";
import {
  applyReview,
  getLeitnerBoxLabel,
  initializeLeitnerOnSolve,
  isReviewDue,
  toDateValue,
} from "@/lib/leitner";

describe("leitner", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("initializes a new solved problem in box 0", () => {
    const entry = initializeLeitnerOnSolve(now);
    expect(entry.leitnerBox).toBe(0);
    expect(entry.nextReviewAt?.toISOString()).toBe(now.toISOString());
  });

  it("moves from box 0 to box 1 on pass", () => {
    const result = applyReview(
      { leitnerBox: 0, nextReviewAt: now, lastReviewedAt: null, reviewCount: 0 },
      "pass",
      now,
    );
    expect(result.toBox).toBe(1);
    expect(result.leitnerBox).toBe(1);
    expect(result.reviewCount).toBe(1);
  });

  it("resets to box 1 on fail", () => {
    const result = applyReview(
      { leitnerBox: 4, nextReviewAt: now, lastReviewedAt: now, reviewCount: 3 },
      "fail",
      now,
    );
    expect(result.toBox).toBe(1);
    expect(result.leitnerBox).toBe(1);
  });

  it("marks mastered after box 5 pass", () => {
    const result = applyReview(
      { leitnerBox: 5, nextReviewAt: now, lastReviewedAt: now, reviewCount: 5 },
      "pass",
      now,
    );
    expect(result.toBox).toBe(6);
    expect(result.nextReviewAt).toBeNull();
  });

  it("detects due reviews from ISO strings", () => {
    expect(isReviewDue("2025-12-31T00:00:00.000Z", now)).toBe(true);
    expect(isReviewDue("2026-01-02T00:00:00.000Z", now)).toBe(false);
    expect(isReviewDue(null, now)).toBe(false);
  });

  it("parses date values safely", () => {
    expect(toDateValue("2026-01-01T00:00:00.000Z")?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(toDateValue("invalid")).toBeNull();
  });

  it("returns readable box labels", () => {
    expect(getLeitnerBoxLabel(0)).toBe("New");
    expect(getLeitnerBoxLabel(6)).toBe("Mastered");
  });
});
