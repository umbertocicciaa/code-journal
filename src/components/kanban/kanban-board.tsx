"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getLeitnerBoxLabel, isReviewDue } from "@/lib/leitner";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { moveKanbanCardAction } from "@/server/actions/review-actions";
import { Badge, difficultyBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KanbanEntry {
  id: string;
  leitnerBox: number;
  nextReviewAt: Date | string | null;
  problem: {
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  };
}

const columns = [0, 1, 2, 3, 4, 5, 6];

function KanbanCard({ entry }: { entry: KanbanEntry }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: entry.id,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const due = isReviewDue(entry.nextReviewAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-grab rounded-2xl border border-line bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{entry.problem.title}</p>
        <Link
          href={`/journal/${entry.id}`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`Open ${entry.problem.title}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition group-hover:opacity-100 hover:bg-black/5 hover:text-foreground"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={difficultyBadgeVariant(entry.problem.difficulty)}>
          {entry.problem.difficulty}
        </Badge>
        {due ? <Badge variant="accent">Due</Badge> : null}
      </div>
    </div>
  );
}

function KanbanColumn({
  box,
  entries,
}: {
  box: number;
  entries: KanbanEntry[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: String(box) });
  const isMastered = box === 6;

  return (
    <div
      className={cn(
        "flex min-w-[220px] flex-col rounded-[24px] border border-line/70 bg-card-muted p-3 transition",
        isOver && "border-accent/60 bg-accent-soft/60",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{getLeitnerBoxLabel(box)}</p>
        <span
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium",
            isMastered ? "bg-brand text-ink" : "bg-ink text-white",
          )}
        >
          {entries.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex min-h-[220px] flex-1 flex-col gap-2">
        {entries.map((entry) => (
          <KanbanCard key={entry.id} entry={entry} />
        ))}
        {entries.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line text-xs text-muted">
            Drop here
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoard({ entries }: { entries: KanbanEntry[] }) {
  const router = useRouter();
  const feedback = useFeedback();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const grouped = useMemo(() => {
    const map = new Map<number, KanbanEntry[]>();
    for (const column of columns) {
      map.set(column, []);
    }
    for (const entry of entries) {
      const box = Math.min(Math.max(entry.leitnerBox, 0), 6);
      map.get(box)?.push(entry);
    }
    return map;
  }, [entries]);

  const activeEntry = entries.find((entry) => entry.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const entryId = String(event.active.id);
    const overId = event.over?.id;
    if (overId === undefined || overId === null) {
      return;
    }

    const toBox = Number(overId);
    if (Number.isNaN(toBox)) {
      return;
    }

    startTransition(async () => {
      const result = await moveKanbanCardAction({ userProblemId: entryId, toBox });
      if (!result.success) {
        feedback.showError("Unable to move card", result.error);
        return;
      }
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return (
      <Card tone="muted">
        <CardContent className="py-14 text-center">
          <p className="text-lg font-medium">No solved problems yet</p>
          <p className="mt-1 text-sm text-muted">
            Mark a problem as solved in your journal to see it on the Leitner board.
          </p>
          <Button asChild className="mt-5">
            <Link href="/journal">Go to journal</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="grid min-w-[1560px] grid-cols-7 gap-3">
          {columns.map((box) => (
            <KanbanColumn key={box} box={box} entries={grouped.get(box) ?? []} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeEntry ? (
          <div className="rounded-2xl bg-ink p-3 text-sm font-medium text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]">
            {activeEntry.problem.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
