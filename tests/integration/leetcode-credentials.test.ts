import { describe, expect, it } from "vitest";
import {
  deleteLeetcodeCredentials,
  getLeetcodeCredentials,
  saveLeetcodeCredentials,
} from "@/server/repositories/leetcode-credentials";
import { createTestUser } from "./helpers";

describe("leetcode credentials", () => {
  it("encrypts credentials at rest and decrypts on read", async () => {
    const user = await createTestUser();
    const session = "LEETCODE_SESSION=abc1234567890";
    const csrf = "csrftoken=xyz1234567890";

    await saveLeetcodeCredentials(user.id, { session, csrf }, true);

    const stored = await getLeetcodeCredentials(user.id);
    expect(stored?.session).toBe(session);
    expect(stored?.csrf).toBe(csrf);
    expect(stored?.lastVerifiedAt).not.toBeNull();
  });

  it("updates existing credentials", async () => {
    const user = await createTestUser();

    await saveLeetcodeCredentials(
      user.id,
      { session: "session-one-1234567890", csrf: "csrf-one-1234567890" },
      true,
    );
    await saveLeetcodeCredentials(
      user.id,
      { session: "session-two-1234567890", csrf: "csrf-two-1234567890" },
      false,
    );

    const stored = await getLeetcodeCredentials(user.id);
    expect(stored?.session).toBe("session-two-1234567890");
    expect(stored?.csrf).toBe("csrf-two-1234567890");
  });

  it("deletes stored credentials", async () => {
    const user = await createTestUser();

    await saveLeetcodeCredentials(
      user.id,
      { session: "session-del-1234567890", csrf: "csrf-del-1234567890" },
      true,
    );
    await deleteLeetcodeCredentials(user.id);

    const stored = await getLeetcodeCredentials(user.id);
    expect(stored).toBeNull();
  });
});
