import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

describe("crypto", () => {
  it("encrypts and decrypts secrets", () => {
    const encrypted = encryptSecret("leetcode-session-value");
    expect(encrypted).not.toContain("leetcode-session-value");
    expect(decryptSecret(encrypted)).toBe("leetcode-session-value");
  });
});
