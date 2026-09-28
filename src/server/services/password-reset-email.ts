export type PasswordResetEmailPayload = {
  user: { id: string; email: string; name: string };
  url: string;
  token: string;
};

const outbox = new Map<string, PasswordResetEmailPayload>();

export function capturePasswordResetEmail(payload: PasswordResetEmailPayload) {
  outbox.set(payload.user.email.toLowerCase(), payload);
}

export function getPasswordResetEmailForAddress(email: string) {
  return outbox.get(email.toLowerCase()) ?? null;
}

export function clearPasswordResetEmails() {
  outbox.clear();
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload) {
  if (process.env.PASSWORD_RESET_EMAIL_CAPTURE === "true") {
    capturePasswordResetEmail(payload);
    return;
  }

  console.info(
    `[password-reset] Reset link for ${payload.user.email}: ${payload.url}`,
  );
}
