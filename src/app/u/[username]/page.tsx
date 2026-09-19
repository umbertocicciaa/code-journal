import { notFound } from "next/navigation";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { findUserByUsername } from "@/server/repositories/users";
import { getUserStats } from "@/server/services/stats";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await findUserByUsername(username);

  if (!user) {
    notFound();
  }

  if (!user.statsPublic) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_35%)]" />
        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <Card>
            <CardContent className="py-12 text-center text-white/70">
              @{user.username} has private stats.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = await getUserStats(user.id);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.25),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">{user.name}</h1>
          <p className="text-white/60">@{user.username}</p>
        </div>
        <StatsDashboard stats={stats} />
      </div>
    </div>
  );
}
