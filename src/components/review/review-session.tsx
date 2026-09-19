"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, X, Check } from "lucide-react";
import { CodeBlock } from "@/components/code/code-block";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { submitReviewAction } from "@/server/actions/review-actions";

interface ReviewEntry {
  id: string;
  notesMd: string;
  problem: {
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    descriptionMd: string;
  };
  solutions: Array<{
    id: string;
    title: string;
    language: string;
    bodyMd: string;
  }>;
}

export function ReviewSession({ entries }: { entries: ReviewEntry[] }) {
  const router = useRouter();
  const feedback = useFeedback();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (entries.length === 0) {
    return (
      <Card tone="muted">
        <CardContent className="py-14 text-center">
          <p className="text-lg font-medium">Nothing due right now</p>
          <p className="mt-1 text-sm text-muted">
            Great job staying on top of your queue. Come back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = entries[index];
  const progress = ((index + 1) / entries.length) * 100;

  function submit(outcome: "pass" | "fail") {
    startTransition(async () => {
      const result = await submitReviewAction({
        userProblemId: current.id,
        outcome,
      });
      if (!result.success) {
        feedback.showError("Review failed", result.error);
        return;
      }
      setRevealed(false);
      if (index >= entries.length - 1) {
        router.refresh();
        setIndex(0);
      } else {
        setIndex((value) => value + 1);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 text-sm text-muted">
        <div className="flex flex-1 items-center gap-3">
          <span className="whitespace-nowrap font-medium text-foreground">
            {index + 1} / {entries.length}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Link
          href={`/journal/${current.id}`}
          className="whitespace-nowrap hover:text-foreground hover:underline"
        >
          Open in journal
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-2xl">{current.problem.title}</CardTitle>
            <Badge variant={difficultyBadgeVariant(current.problem.difficulty)}>
              {current.problem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <MarkdownViewer content={current.problem.descriptionMd} />

          <div className="rounded-[24px] border border-line bg-card-muted p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">Notes & solutions</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRevealed((value) => !value)}
              >
                {revealed ? (
                  <>
                    <EyeOff className="h-4 w-4" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Reveal
                  </>
                )}
              </Button>
            </div>
            {revealed ? (
              <div className="space-y-4">
                <MarkdownViewer content={current.notesMd} />
                {current.solutions.map((solution) => (
                  <CodeBlock
                    key={solution.id}
                    code={solution.bodyMd}
                    language={solution.language}
                    title={solution.title}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Try to recall your approach before revealing your notes.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              size="lg"
              className="flex-1"
              onClick={() => submit("fail")}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Forgot
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => submit("pass")}
              disabled={isPending}
            >
              <Check className="h-4 w-4" />
              Remembered
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
