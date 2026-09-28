import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
          Request a new reset link
        </Link>
      </p>
    </AuthShell>
  );
}
