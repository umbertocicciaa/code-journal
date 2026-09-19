import { PageHeader } from "@/components/layout/page-header";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { getUserStats } from "@/server/services/stats";
import { requireSession } from "@/server/session";

export default async function StatsPage() {
  const session = await requireSession();
  const stats = await getUserStats(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Stats" description="Your coding activity overview" />
      <StatsDashboard stats={stats} />
    </div>
  );
}
