import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { getUserStats } from "@/server/services/stats";
import { requireSession } from "@/server/session";

export default async function StatsPage() {
  const session = await requireSession();
  const stats = await getUserStats(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Stats</h1>
        <p className="text-white/60">Your coding activity overview</p>
      </div>
      <StatsDashboard stats={stats} />
    </div>
  );
}
