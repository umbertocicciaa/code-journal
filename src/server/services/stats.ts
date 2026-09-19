import {
  buildActivityMap,
  calculateStreaks,
  generateHeatmapDays,
} from "@/lib/stats";
import {
  countSolvedProblems,
  countUserProblems,
  countUserProblemsByBox,
  countUserProblemsByDifficulty,
  countUserProblemsByTopic,
  getReviewAccuracy,
  getSolvedOverTime,
  getUserActivityByDay,
} from "@/server/repositories/user-problems";

export async function getUserStats(userId: string) {
  try {
    const [
      total,
      solved,
      byDifficulty,
      byTopicResult,
      byBox,
      activityResult,
      solvedOverTimeResult,
      reviewAccuracy,
    ] = await Promise.all([
      countUserProblems(userId),
      countSolvedProblems(userId),
      countUserProblemsByDifficulty(userId),
      countUserProblemsByTopic(userId),
      countUserProblemsByBox(userId),
      getUserActivityByDay(userId),
      getSolvedOverTime(userId),
      getReviewAccuracy(userId),
    ]);

    const activityRows = Array.from(activityResult);
    const activityMap = buildActivityMap(activityRows);
    const streaks = calculateStreaks(activityMap);
    const heatmap = generateHeatmapDays(activityMap);

    return {
      total,
      solved,
      byDifficulty,
      byTopic: Array.from(byTopicResult),
      byBox,
      heatmap,
      streaks,
      solvedOverTime: Array.from(solvedOverTimeResult),
      reviewAccuracy,
    };
  } catch (error) {
    console.error("getUserStats failed:", error);
    return {
      total: 0,
      solved: 0,
      byDifficulty: [],
      byTopic: [],
      byBox: [],
      heatmap: generateHeatmapDays(new Map()),
      streaks: { current: 0, longest: 0 },
      solvedOverTime: [],
      reviewAccuracy: { pass: 0, fail: 0, total: 0, accuracy: 0 },
    };
  }
}
