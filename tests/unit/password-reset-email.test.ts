import { afterEach, describe, expect, it } from "vitest";
import {
  clearPasswordResetEmails,
  getPasswordResetEmailForAddress,
  sendPasswordResetEmail,
} from "@/server/services/password-reset-email";

describe("password reset email capture", () => {
  afterEach(() => {
    clearPasswordResetEmails();
    delete process.env.PASSWORD_RESET_EMAIL_CAPTURE;
  });

  it("stores reset messages when capture mode is enabled", async () => {
    process.env.PASSWORD_RESET_EMAIL_CAPTURE = "true";

    await sendPasswordResetEmail({
      user: { id: "u1", email: "User@Example.com", name: "User" },
      url: "http://localhost:3000/reset-password/tok?callbackURL=%2Freset-password",
      token: "tok",
    });

    const captured = getPasswordResetEmailForAddress("user@example.com");
    expect(captured?.token).toBe("tok");
    expect(captured?.url).toContain("/reset-password/tok");
  });
});
