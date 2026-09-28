"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/server/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    linkError === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired. Request a new one."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Missing reset token. Open the link from your email again.");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      token,
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setPending(false);
      setError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    const result = await authClient.resetPassword({
      newPassword: parsed.data.password,
      token: parsed.data.token,
    });

    setPending(false);
    if (result.error) {
      setError("Unable to reset your password. The link may have expired.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            {error ??
              "Use the link from your email to choose a new password. Links expire after five minutes."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          {error ? (
            <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
