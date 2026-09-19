"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HeatmapActivityType } from "@/server/repositories/user-problems";
import { getActivityForDayAction } from "@/server/actions/stats-actions";
import { cn } from "@/lib/utils";

interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface DayProblem {
  userProblemId: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  activities: HeatmapActivityType[];
}

const levelClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-black/[0.05]",
  1: "bg-accent/25",
  2: "bg-accent/45",
  3: "bg-accent/70",
  4: "bg-accent",
};

const activityLabels: Record<HeatmapActivityType, string> = {
  solved: "Solved",
  reviewed: "Reviewed",
  solution: "Solution added",
};

function formatActivityDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function ActivityHeatmap({
  days,
  interactive = true,
}: {
  days: HeatmapDay[];
  interactive?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [problems, setProblems] = useState<DayProblem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function openDay(date: string, count: number) {
    if (!interactive || count <= 0) {
      return;
    }

    setSelectedDate(date);
    setProblems([]);
    setLoadError(null);

    startTransition(async () => {
      const result = await getActivityForDayAction({ date });
      if (!result.success) {
        setLoadError(result.error);
        return;
      }
      setProblems(result.problems);
    });
  }

  function closeDialog() {
    setSelectedDate(null);
    setProblems([]);
    setLoadError(null);
  }

  return (
    <>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const isInteractive = interactive && day.count > 0;
                return (
                  <button
                    key={day.date}
                    type="button"
                    title={
                      day.count > 0
                        ? `${day.date}: ${day.count} activities${isInteractive ? " — click to view" : ""}`
                        : `${day.date}: no activity`
                    }
                    disabled={!isInteractive}
                    onClick={() => openDay(day.date, day.count)}
                    className={cn(
                      "h-3 w-3 rounded-[4px] transition",
                      levelClasses[day.level],
                      isInteractive &&
                        "cursor-pointer hover:ring-2 hover:ring-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
                      !isInteractive && "cursor-default",
                    )}
                    aria-label={`${day.date}, ${day.count} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={cn("h-3 w-3 rounded-[4px]", levelClasses[level])} />
        ))}
        <span>More</span>
      </div>

      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? formatActivityDate(selectedDate) : "Activity"}
            </DialogTitle>
            <DialogDescription>
              Problems you solved, reviewed, or added solutions for on this day.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <p className="py-6 text-center text-sm text-muted">Loading…</p>
          ) : loadError ? (
            <p className="py-6 text-center text-sm text-accent">{loadError}</p>
          ) : problems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No activity recorded for this day.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {problems.map((problem) => (
                <li
                  key={problem.userProblemId}
                  className="rounded-2xl border border-line bg-card-muted p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{problem.title}</p>
                      <p className="font-mono text-xs text-muted">{problem.slug}</p>
                    </div>
                    <Badge variant={difficultyBadgeVariant(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {problem.activities.map((activity) => (
                      <Badge key={activity} variant="outline">
                        {activityLabels[activity]}
                      </Badge>
                    ))}
                    <Link
                      href={`/journal/${problem.userProblemId}`}
                      className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                    >
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
