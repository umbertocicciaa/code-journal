import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import type { getUserStats } from "@/server/services/stats";

type PublicProfileUser = {
  name: string;
  username: string;
  statsPublic: boolean;
};

export function PublicProfileView({
  user,
  stats,
}: {
  user: PublicProfileUser;
  stats: Awaited<ReturnType<typeof getUserStats>> | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-[34px]">
          {user.name}
        </h1>
        <p className="mt-1 text-muted">Public practice stats</p>
      </div>

      {user.statsPublic && stats ? (
        <StatsDashboard stats={stats} interactiveHeatmap={false} />
      ) : (
        <Card tone="muted">
          <CardContent className="py-14 text-center text-muted">
            @{user.username} keeps their stats private.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
