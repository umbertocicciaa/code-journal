import { describe, expect, it } from "vitest";
import { getPublicProfileByUsername } from "@/server/services/public-profile";
import { createTestUser, seedJournalEntry } from "./helpers";

describe("public profile page data", () => {
  it("loads public stats for an existing username", async () => {
    const user = await createTestUser({
      username: "public_profile_user",
      name: "Public Profile User",
    });
    await seedJournalEntry({ userId: user.id, status: "solved" });

    const profile = await getPublicProfileByUsername(user.username);
    expect(profile?.user.id).toBe(user.id);
    expect(profile?.stats).not.toBeNull();
    expect(profile?.stats?.total).toBeGreaterThan(0);
  });

  it("hides stats when the user keeps them private", async () => {
    const user = await createTestUser({ username: "private_profile_user" });
    const { db } = await import("@/server/db/client");
    const { user: userTable } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(userTable)
      .set({ statsPublic: false })
      .where(eq(userTable.id, user.id));

    const profile = await getPublicProfileByUsername(user.username);
    expect(profile?.user.statsPublic).toBe(false);
    expect(profile?.stats).toBeNull();
  });
});
