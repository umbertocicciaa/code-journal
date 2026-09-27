import { describe, expect, it } from "vitest";
import {
  deleteNeetcodeCredentials,
  getNeetcodeCredentials,
  saveNeetcodeCredentials,
} from "@/server/repositories/neetcode-credentials";
import { createTestUser } from "./helpers";

describe("neetcode credentials", () => {
  it("encrypts credentials at rest and decrypts on read", async () => {
    const user = await createTestUser();
    const refreshToken = "AMf-vBz123456789012345678901234567890";

    await saveNeetcodeCredentials(user.id, { refreshToken }, true);

    const stored = await getNeetcodeCredentials(user.id);
    expect(stored?.refreshToken).toBe(refreshToken);
    expect(stored?.lastVerifiedAt).not.toBeNull();
  });

  it("updates existing credentials", async () => {
    const user = await createTestUser();

    await saveNeetcodeCredentials(
      user.id,
      { refreshToken: "token-one-123456789012345678901" },
      true,
    );
    await saveNeetcodeCredentials(
      user.id,
      { refreshToken: "token-two-123456789012345678901" },
      false,
    );

    const stored = await getNeetcodeCredentials(user.id);
    expect(stored?.refreshToken).toBe("token-two-123456789012345678901");
  });

  it("deletes stored credentials", async () => {
    const user = await createTestUser();

    await saveNeetcodeCredentials(
      user.id,
      { refreshToken: "token-del-123456789012345678901" },
      true,
    );
    await deleteNeetcodeCredentials(user.id);

    const stored = await getNeetcodeCredentials(user.id);
    expect(stored).toBeNull();
  });
});
