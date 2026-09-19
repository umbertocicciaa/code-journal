export interface DailyActivity {
  date: string;
  count: number;
}

export interface StreakResult {
  current: number;
  longest: number;
}

export function buildActivityMap(
  activities: DailyActivity[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const activity of activities) {
    map.set(activity.date, activity.count);
  }
  return map;
}

export function calculateStreaks(
  activityMap: Map<string, number>,
  today: Date = new Date(),
): StreakResult {
  let current = 0;
  let longest = 0;
  let running = 0;

  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const count = activityMap.get(key) ?? 0;
    if (count <= 0) {
      break;
    }
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - 364);

  for (let i = 0; i < 365; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    const count = activityMap.get(key) ?? 0;
    if (count > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  return { current, longest };
}

export function getHeatmapLevels(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 4;
  }
  if (ratio >= 0.5) {
    return 3;
  }
  if (ratio >= 0.25) {
    return 2;
  }
  return 1;
}

export function generateHeatmapDays(
  activityMap: Map<string, number>,
  days = 365,
  today: Date = new Date(),
): Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> {
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));

  const result: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> =
    [];
  let maxCount = 0;

  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    const count = activityMap.get(date) ?? 0;
    maxCount = Math.max(maxCount, count);
    result.push({ date, count, level: 0 });
  }

  return result.map((entry) => ({
    ...entry,
    level: getHeatmapLevels(entry.count, maxCount),
  }));
}
