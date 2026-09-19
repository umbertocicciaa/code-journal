import { KanbanBoard } from "@/components/kanban/kanban-board";
import { listKanbanProblems } from "@/server/repositories/user-problems";
import { requireSession } from "@/server/session";

export default async function KanbanPage() {
  const session = await requireSession();
  const entries = await listKanbanProblems(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Kanban</h1>
        <p className="text-white/60">Drag cards between Leitner boxes</p>
      </div>
      <KanbanBoard entries={entries} />
    </div>
  );
}
