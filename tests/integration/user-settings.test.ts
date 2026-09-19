import { describe, expect, it } from "vitest";
import {
  findUserByUsername,
  updateUserSettings,
} from "@/server/repositories/users";
import {
  deleteUserTag,
  listUserTags,
} from "@/server/repositories/user-problems";
import { createTestUser, seedUserTag } from "./helpers";

describe("user settings and profile", () => {
  it("updates profile settings", async () => {
    const user = await createTestUser({ name: "Before" });

    const updated = await updateUserSettings(user.id, {
      name: "After",
      statsPublic: false,
    });

    expect(updated?.name).toBe("After");
    expect(updated?.statsPublic).toBe(false);

    const found = await findUserByUsername(user.username);
    expect(found?.id).toBe(user.id);
  });

  it("deletes user tags", async () => {
    const user = await createTestUser();
    const tag = await seedUserTag(user.id, "Temporary");

    await deleteUserTag(user.id, tag.id);

    const tags = await listUserTags(user.id);
    expect(tags.some((item) => item.id === tag.id)).toBe(false);
  });
});
