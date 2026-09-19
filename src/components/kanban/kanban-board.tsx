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
import { getLeitnerBoxLabel, isReviewDue } from "@/lib/leitner";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { moveKanbanCardAction } from "@/server/actions/review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab rounded-2xl border border-white/10 bg-black/25 p-3 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-medium text-white">{entry.problem.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge>{entry.problem.difficulty}</Badge>
        {isReviewDue(entry.nextReviewAt) ? (
          <Badge className="border-amber-400/30 bg-amber-500/20 text-amber-100">
            due
          </Badge>
        ) : null}
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-2 h-8 px-2 text-xs">
        <Link href={`/journal/${entry.id}`} onClick={(event) => event.stopPropagation()}>
          Open
        </Link>
      </Button>
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

  return (
    <Card className="min-w-[220px]">
      <CardHeader>
        <CardTitle className="text-sm">
          {getLeitnerBoxLabel(box)} ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[240px] space-y-3 transition",
            isOver && "rounded-2xl bg-white/5 ring-2 ring-indigo-400/40",
          )}
        >
          {entries.map((entry) => (
            <KanbanCard key={entry.id} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardContent className="py-12 text-center text-white/70">
          <p>No solved problems yet.</p>
          <p className="mt-2 text-sm text-white/50">
            Mark a problem as solved in your journal to see it on the Leitner board.
          </p>
          <Button asChild className="mt-4">
            <Link href="/journal">Go to journal</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid gap-4 overflow-x-auto md:grid-cols-4 xl:grid-cols-7">
        {columns.map((box) => (
          <KanbanColumn key={box} box={box} entries={grouped.get(box) ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeEntry ? (
          <div className="rounded-2xl border border-white/20 bg-black/50 p-3 backdrop-blur-xl">
            {activeEntry.problem.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
