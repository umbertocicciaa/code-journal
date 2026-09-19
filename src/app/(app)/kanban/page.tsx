import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { listKanbanProblems } from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";

export default async function KanbanPage() {
  const session = await requireSession();
  const entries = await listKanbanProblems(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban"
        description="Drag cards between Leitner boxes to reschedule reviews"
      />
      <KanbanBoard entries={entries} />
    </div>
  );
}
