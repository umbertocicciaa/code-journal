import { describe, expect, it } from "vitest";
import { PASSWORD_RESET_TOKEN_TTL_SECONDS } from "@/lib/password-reset";
import { forgotPasswordSchema, resetPasswordSchema } from "@/server/validation";

describe("password reset validation", () => {
  it("uses a five-minute token ttl", () => {
    expect(PASSWORD_RESET_TOKEN_TTL_SECONDS).toBe(300);
  });

  it("validates forgot-password email input", () => {
    expect(forgotPasswordSchema.parse({ email: "user@example.com" })).toEqual({
      email: "user@example.com",
    });
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("validates reset-password token and password", () => {
    expect(
      resetPasswordSchema.parse({ token: "abc123", password: "password123" }),
    ).toEqual({ token: "abc123", password: "password123" });
    expect(
      resetPasswordSchema.safeParse({ token: "", password: "password123" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "short" }).success,
    ).toBe(false);
  });
});
