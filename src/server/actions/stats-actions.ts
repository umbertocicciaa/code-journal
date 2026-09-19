"use server";

import { getUserActivityForDate } from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";
import { activityDateSchema } from "@/server/validation";

export async function getActivityForDayAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = activityDateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: "Invalid date" };
    }

    const problems = await getUserActivityForDate(
      session.user.id,
      parsed.data.date,
    );

    return { success: true as const, problems };
  } catch (error) {
    console.error("getActivityForDayAction failed:", error);
    return {
      success: false as const,
      error: "Unable to load activity for this day.",
    };
  }
}
