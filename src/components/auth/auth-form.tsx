"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatAuthError(message: string | undefined): string {
  if (!message) {
    return "Something went wrong. Please try again.";
  }

  const normalized = message.toLowerCase();
  if (normalized.includes("username")) {
    return "Username must be 3–30 characters and use only letters, numbers, underscores, or dots.";
  }
  if (normalized.includes("password")) {
    return "Password must be at least 8 characters.";
  }
  if (normalized.includes("email")) {
    return "This email is already registered or invalid.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    setPending(false);
    if (result.error) {
      setError(formatAuthError(result.error.message));
      return;
    }

    router.push("/journal");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error ? (
            <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username")).trim();
    const password = String(formData.get("password"));

    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      setPending(false);
      setError(
        "Username must be 3–30 characters and use only letters, numbers, underscores, or dots.",
      );
      return;
    }

    if (password.length < 8) {
      setPending(false);
      setError("Password must be at least 8 characters.");
      return;
    }

    const result = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password,
      username,
    });

    setPending(false);
    if (result.error) {
      setError(formatAuthError(result.error.message));
      return;
    }

    router.push("/journal");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.]+"
              title="Letters, numbers, underscores, and dots only"
            />
            <p className="text-xs text-muted">
              3–30 characters. Letters, numbers, underscores, and dots only.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          {error ? (
            <p className="rounded-2xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
