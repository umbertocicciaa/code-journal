import { findUserByUsername } from "@/server/repositories/users";
import { getUserStats } from "@/server/services/stats";

export async function getPublicProfileByUsername(username: string) {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }

  return {
    user,
    stats: user.statsPublic ? await getUserStats(user.id) : null,
  };
}
