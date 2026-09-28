import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
      <p className="mt-3 text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
