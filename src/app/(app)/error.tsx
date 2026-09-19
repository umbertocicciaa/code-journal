"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            An unexpected error occurred. You can retry or go back to your
            journal.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="secondary">
              <Link href="/journal">Back to journal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
