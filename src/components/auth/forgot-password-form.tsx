"use client";

import { useState } from "react";
import { authClient } from "@/server/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/server/validation";

const GENERIC_SUCCESS =
  "If this email exists in our system, check your inbox for a reset link. The link expires in five minutes.";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setPending(false);
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const result = await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo,
    });

    setPending(false);
    if (result.error) {
      setError("Unable to send a reset link right now. Please try again.");
      return;
    }

    setMessage(GENERIC_SUCCESS);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {error ? (
            <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl bg-card-muted px-3 py-2 text-sm text-muted">
              {message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
