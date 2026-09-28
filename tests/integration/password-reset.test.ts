import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { verification } from "@/server/db/schema";
import {
  clearPasswordResetEmails,
  getPasswordResetEmailForAddress,
} from "@/server/services/password-reset-email";

afterEach(() => {
  clearPasswordResetEmails();
});

async function createCredentialUser() {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const email = `reset.${suffix}@example.com`;
  const password = "oldpassword123";
  const username = `reset_${suffix}`;

  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Reset User",
      username,
    },
  });

  return { email, password };
}

describe("password reset", () => {
  it("sends a reset token only for known emails and allows a new password", async () => {
    const { email, password: oldPassword } = await createCredentialUser();
    const newPassword = "newpassword456";

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "http://localhost:3000/reset-password",
      },
    });

    const captured = getPasswordResetEmailForAddress(email);
    expect(captured?.token).toBeTruthy();

    await auth.api.resetPassword({
      body: {
        newPassword,
        token: captured!.token,
      },
    });

    await expect(
      auth.api.signInEmail({
        body: { email, password: oldPassword },
      }),
    ).rejects.toBeDefined();

    const session = await auth.api.signInEmail({
      body: { email, password: newPassword },
    });
    expect(session.user.email).toBe(email);
  });

  it("returns the same response shape for unknown emails", async () => {
    const response = await auth.api.requestPasswordReset({
      body: {
        email: "missing-user@example.com",
        redirectTo: "http://localhost:3000/reset-password",
      },
    });

    expect(response.status).toBe(true);
    expect(getPasswordResetEmailForAddress("missing-user@example.com")).toBeNull();
  });

  it("rejects expired reset tokens", async () => {
    const { email } = await createCredentialUser();

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "http://localhost:3000/reset-password",
      },
    });

    const captured = getPasswordResetEmailForAddress(email);
    expect(captured?.token).toBeTruthy();

    await db
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(verification.identifier, `reset-password:${captured!.token}`));

    await expect(
      auth.api.resetPassword({
        body: {
          newPassword: "anotherpassword1",
          token: captured!.token,
        },
      }),
    ).rejects.toBeDefined();
  });
});
