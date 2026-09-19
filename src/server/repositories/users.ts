import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";

export async function findUserByUsername(username: string) {
  return db.query.user.findFirst({
    where: eq(user.username, username),
  });
}

export async function findUserById(id: string) {
  return db.query.user.findFirst({
    where: eq(user.id, id),
  });
}

export async function updateUserSettings(
  userId: string,
  input: { statsPublic?: boolean; name?: string },
) {
  await db
    .update(user)
    .set({
      ...(input.statsPublic !== undefined
        ? { statsPublic: input.statsPublic }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return findUserById(userId);
}
