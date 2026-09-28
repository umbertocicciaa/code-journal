import { describe, expect, it } from "vitest";
import { searchUsers } from "@/server/repositories/users";
import { createTestUser } from "./helpers";

describe("user search", () => {
  it("matches username and display name case-insensitively", async () => {
    const alpha = await createTestUser({
      username: "search_alpha_user",
      name: "Alpha Searchable",
    });
    await createTestUser({
      username: "search_beta_user",
      name: "Beta Person",
    });

    const byUsername = await searchUsers("SEARCH_ALPHA");
    expect(byUsername.some((row) => row.id === alpha.id)).toBe(true);

    const byName = await searchUsers("searchable");
    expect(byName.some((row) => row.id === alpha.id)).toBe(true);
  });

  it("returns an empty list for blank queries", async () => {
    await createTestUser();
    expect(await searchUsers("")).toEqual([]);
    expect(await searchUsers("   ")).toEqual([]);
  });
});
