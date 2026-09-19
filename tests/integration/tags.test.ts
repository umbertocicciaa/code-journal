import { describe, expect, it } from "vitest";
import {
  listUserProblems,
  listUserTags,
  setUserProblemTags,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry, seedUserTag } from "./helpers";

describe("user tags", () => {
  it("creates tags and attaches them to journal entries", async () => {
    const user = await createTestUser();
    const tagA = await seedUserTag(user.id, "Revisit", "#ff6b3b");
    const tagB = await seedUserTag(user.id, "Interview", "#22c55e");
    const { entry } = await seedJournalEntry({ userId: user.id });

    await setUserProblemTags(user.id, entry.id, [tagA.id, tagB.id]);

    const loaded = await listUserProblems(user.id, { tagId: tagA.id });
    expect(loaded.some((row) => row.id === entry.id)).toBe(true);

    const tags = await listUserTags(user.id);
    expect(tags.map((tag) => tag.name).sort()).toEqual(["Interview", "Revisit"]);
  });

  it("replaces tags when set again", async () => {
    const user = await createTestUser();
    const keep = await seedUserTag(user.id, "Keep");
    const drop = await seedUserTag(user.id, "Drop");
    const { entry } = await seedJournalEntry({ userId: user.id });

    await setUserProblemTags(user.id, entry.id, [keep.id, drop.id]);
    await setUserProblemTags(user.id, entry.id, [keep.id]);

    const filtered = await listUserProblems(user.id, { tagId: drop.id });
    expect(filtered.some((row) => row.id === entry.id)).toBe(false);
  });
});
