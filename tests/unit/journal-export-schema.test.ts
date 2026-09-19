import { describe, expect, it } from "vitest";
import {
  JOURNAL_EXPORT_FORMAT,
  JOURNAL_EXPORT_VERSION,
  journalExportSchema,
} from "@/server/validation";

const validExport = {
  format: JOURNAL_EXPORT_FORMAT,
  version: JOURNAL_EXPORT_VERSION,
  exportedAt: "2026-09-19T20:00:00.000Z",
  tags: [{ name: "Revisit", color: "#ff6b3b" }],
  entries: [
    {
      problem: {
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "EASY",
        url: "https://leetcode.com/problems/two-sum/",
        source: "leetcode",
        leetcodeFrontendId: "1",
        isPaidOnly: false,
        descriptionMd: "Given an array...",
        topics: [{ slug: "array", name: "Array" }],
        companies: [{ slug: "google", name: "Google", frequency: 3 }],
      },
      status: "solved",
      solvedAt: "2026-09-01T10:00:00.000Z",
      notesMd: "Hash map",
      leitnerBox: 2,
      nextReviewAt: "2026-09-25T10:00:00.000Z",
      lastReviewedAt: "2026-09-18T10:00:00.000Z",
      reviewCount: 2,
      tags: ["Revisit"],
      solutions: [
        {
          title: "Main solution",
          language: "cpp",
          bodyMd: "class Solution {};",
          createdAt: "2026-09-01T10:05:00.000Z",
          updatedAt: "2026-09-01T10:05:00.000Z",
        },
      ],
      reviewLogs: [
        {
          reviewedAt: "2026-09-18T10:00:00.000Z",
          outcome: "pass",
          fromBox: 1,
          toBox: 2,
        },
      ],
    },
  ],
};

describe("journalExportSchema", () => {
  it("accepts a full export payload", () => {
    const parsed = journalExportSchema.safeParse(validExport);
    expect(parsed.success).toBe(true);
  });

  it("fills defaults for optional fields", () => {
    const parsed = journalExportSchema.parse({
      format: JOURNAL_EXPORT_FORMAT,
      version: JOURNAL_EXPORT_VERSION,
      exportedAt: "2026-09-19T20:00:00.000Z",
      entries: [
        {
          problem: {
            slug: "manual-one",
            title: "Manual",
            difficulty: "MEDIUM",
            url: "https://example.com/manual-one",
          },
          status: "attempting",
        },
      ],
    });

    const entry = parsed.entries[0];
    expect(parsed.tags).toEqual([]);
    expect(entry.problem.source).toBe("leetcode");
    expect(entry.problem.topics).toEqual([]);
    expect(entry.notesMd).toBe("");
    expect(entry.leitnerBox).toBe(0);
    expect(entry.solutions).toEqual([]);
    expect(entry.reviewLogs).toEqual([]);
  });

  it("rejects unknown formats and versions", () => {
    expect(
      journalExportSchema.safeParse({ ...validExport, format: "other" }).success,
    ).toBe(false);
    expect(
      journalExportSchema.safeParse({ ...validExport, version: 99 }).success,
    ).toBe(false);
  });

  it("rejects invalid dates and boxes", () => {
    const badDate = structuredClone(validExport);
    badDate.entries[0].solvedAt = "not-a-date";
    expect(journalExportSchema.safeParse(badDate).success).toBe(false);

    const badBox = structuredClone(validExport);
    badBox.entries[0].leitnerBox = 9;
    expect(journalExportSchema.safeParse(badBox).success).toBe(false);
  });
});
