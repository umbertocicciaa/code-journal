import { describe, expect, it } from "vitest";
import {
  buildActivityMap,
  calculateStreaks,
  generateHeatmapDays,
  getHeatmapLevels,
} from "@/lib/stats";

describe("stats", () => {
  it("builds activity maps", () => {
    const map = buildActivityMap([
      { date: "2026-01-01", count: 2 },
      { date: "2026-01-02", count: 1 },
    ]);
    expect(map.get("2026-01-01")).toBe(2);
  });

  it("calculates streaks", () => {
    const map = buildActivityMap([
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 2 },
      { date: "2026-01-03", count: 1 },
    ]);
    const streaks = calculateStreaks(map, new Date("2026-01-03T12:00:00.000Z"));
    expect(streaks.current).toBe(3);
    expect(streaks.longest).toBe(3);
  });

  it("generates heatmap levels", () => {
    expect(getHeatmapLevels(0, 10)).toBe(0);
    expect(getHeatmapLevels(10, 10)).toBe(4);
    const days = generateHeatmapDays(
      buildActivityMap([{ date: "2026-01-01", count: 4 }]),
      7,
      new Date("2026-01-07T00:00:00.000Z"),
    );
    expect(days).toHaveLength(7);
  });
});
