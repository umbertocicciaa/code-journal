"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
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
      <Card>
        <CardContent className="py-12 text-center text-white/70">
          No reviews due right now. Great job staying on top of your queue.
        </CardContent>
      </Card>
    );
  }

  const current = entries[index];

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
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>
          Review {index + 1} of {entries.length}
        </span>
        <Link href={`/journal/${current.id}`} className="hover:text-white">
          Open in journal
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{current.problem.title}</CardTitle>
            <Badge variant={difficultyBadgeVariant(current.problem.difficulty)}>
              {current.problem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <MarkdownViewer content={current.problem.descriptionMd} />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium text-white">Notes & solutions</p>
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
                  <div key={solution.id}>
                    <p className="mb-2 text-sm text-white/60">
                      {solution.title} · {solution.language}
                    </p>
                    <MarkdownViewer content={solution.bodyMd} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">
                Try to recall your approach before revealing your notes.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => submit("fail")}
              disabled={isPending}
            >
              Fail
            </Button>
            <Button onClick={() => submit("pass")} disabled={isPending}>
              Pass
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
