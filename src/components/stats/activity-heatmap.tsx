"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  0: "bg-white/5",
  1: "bg-emerald-500/25",
  2: "bg-emerald-500/45",
  3: "bg-emerald-500/65",
  4: "bg-emerald-500/85",
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

export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [problems, setProblems] = useState<DayProblem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function openDay(date: string, count: number) {
    if (count <= 0) {
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
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const isInteractive = day.count > 0;
                return (
                  <button
                    key={day.date}
                    type="button"
                    title={
                      isInteractive
                        ? `${day.date}: ${day.count} activities — click to view`
                        : `${day.date}: no activity`
                    }
                    disabled={!isInteractive}
                    onClick={() => openDay(day.date, day.count)}
                    className={cn(
                      "h-3 w-3 rounded-sm transition",
                      levelClasses[day.level],
                      isInteractive &&
                        "cursor-pointer hover:ring-2 hover:ring-emerald-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70",
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
            <p className="py-6 text-center text-sm text-white/60">Loading…</p>
          ) : loadError ? (
            <p className="py-6 text-center text-sm text-rose-200">{loadError}</p>
          ) : problems.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/60">
              No activity recorded for this day.
            </p>
          ) : (
            <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {problems.map((problem) => (
                <li
                  key={problem.userProblemId}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {problem.title}
                      </p>
                      <p className="text-xs text-white/50">{problem.slug}</p>
                    </div>
                    <Badge variant={difficultyBadgeVariant(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {problem.activities.map((activity) => (
                      <Badge key={activity}>{activityLabels[activity]}</Badge>
                    ))}
                  </div>
                  <Button asChild variant="ghost" size="sm" className="mt-2 h-8 px-2 text-xs">
                    <Link href={`/journal/${problem.userProblemId}`}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
