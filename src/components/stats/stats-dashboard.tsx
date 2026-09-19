"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ActivityHeatmap } from "@/components/stats/activity-heatmap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLeitnerBoxLabel } from "@/lib/leitner";

const palette = {
  accent: "#ff6b3b",
  brand: "#ffe640",
  ink: "#1b1b1b",
  grid: "rgba(0,0,0,0.06)",
  axis: "#9a9a97",
  track: "#efefec",
};

const difficultyColors = {
  EASY: palette.brand,
  MEDIUM: palette.accent,
  HARD: palette.ink,
};

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #e6e6e2",
  boxShadow: "0 12px 30px -18px rgba(0,0,0,0.35)",
  fontSize: 13,
  padding: "8px 12px",
};

interface StatsDashboardProps {
  stats: {
    total: number;
    solved: number;
    byDifficulty: Array<{ difficulty: "EASY" | "MEDIUM" | "HARD"; count: number }>;
    byTopic: Array<{ name: string; count: number }>;
    byBox: Array<{ leitnerBox: number; count: number }>;
    heatmap: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
    streaks: { current: number; longest: number };
    solvedOverTime: Array<{ date: string; count: number }>;
    reviewAccuracy: {
      pass: number;
      fail: number;
      total: number;
      accuracy: number;
    };
  };
  interactiveHeatmap?: boolean;
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted">
      {message}
    </div>
  );
}

function StatCard({
  title,
  description,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  description: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "ink";
}) {
  const isInk = tone === "ink";
  return (
    <Card tone={tone} className="flex flex-col justify-between gap-6 p-5 md:p-6">
      <div>
        <p className="text-base font-medium">{title}</p>
        <p className={isInk ? "text-xs text-white/55" : "text-xs text-muted"}>
          {description}
        </p>
      </div>
      <div>
        <p className="text-4xl font-semibold tracking-tight">{value}</p>
        {hint ? (
          <p className={isInk ? "mt-1 text-xs text-[#7ee2a0]" : "mt-1 text-xs text-positive"}>
            {hint}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function StatsDashboard({ stats, interactiveHeatmap = true }: StatsDashboardProps) {
  const boxData = stats.byBox.map((row) => ({
    name: getLeitnerBoxLabel(row.leitnerBox),
    count: row.count,
  }));

  const solvedPercent =
    stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="ink"
          title="Total tracked"
          description="Problems in your journal"
          value={stats.total}
          hint={stats.total > 0 ? `${solvedPercent}% solved` : undefined}
        />
        <StatCard
          title="Solved"
          description="Marked as solved"
          value={stats.solved}
        />
        <StatCard
          title="Current streak"
          description={`Longest ${stats.streaks.longest} days`}
          value={`${stats.streaks.current}d`}
        />
        <StatCard
          title="Review accuracy"
          description={`${stats.reviewAccuracy.pass} pass · ${stats.reviewAccuracy.fail} fail`}
          value={`${Math.round(stats.reviewAccuracy.accuracy * 100)}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Solves, reviews and solutions over the last year
            {interactiveHeatmap ? " — click a day for details" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap days={stats.heatmap} interactive={interactiveHeatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Leitner distribution</CardTitle>
              <CardDescription>Problems per review box</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {boxData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boxData} barCategoryGap="28%">
                  <CartesianGrid stroke={palette.grid} vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="name"
                    stroke={palette.axis}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke={palette.axis}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={28}
                  />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill={palette.accent}
                    radius={14}
                    maxBarSize={56}
                    background={{ fill: palette.track, radius: 14 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="Mark problems as solved to populate Leitner boxes." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By difficulty</CardTitle>
            <CardDescription>Split of tracked problems</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {stats.byDifficulty.length > 0 ? (
              <div className="flex h-full items-center gap-6">
                <div className="h-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byDifficulty}
                        dataKey="count"
                        nameKey="difficulty"
                        innerRadius="58%"
                        outerRadius="90%"
                        paddingAngle={4}
                        cornerRadius={12}
                        stroke="none"
                      >
                        {stats.byDifficulty.map((entry) => (
                          <Cell
                            key={entry.difficulty}
                            fill={difficultyColors[entry.difficulty]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {stats.byDifficulty.map((entry) => (
                    <li key={entry.difficulty} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: difficultyColors[entry.difficulty] }}
                      />
                      <span className="capitalize">{entry.difficulty.toLowerCase()}</span>
                      <span className="text-muted">{entry.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyChartMessage message="No problems tracked yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top topics</CardTitle>
            <CardDescription>Most practiced LeetCode tags</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {stats.byTopic.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byTopic} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid stroke={palette.grid} horizontal={false} strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    stroke={palette.axis}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    stroke={palette.axis}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill={palette.ink}
                    radius={10}
                    maxBarSize={22}
                    background={{ fill: palette.track, radius: 10 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="Topics appear after problems are imported from LeetCode." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solved over time</CardTitle>
            <CardDescription>Last 90 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {stats.solvedOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.solvedOverTime}>
                  <CartesianGrid stroke={palette.grid} vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="date"
                    stroke={palette.axis}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis
                    stroke={palette.axis}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={palette.accent}
                    strokeWidth={3}
                    dot={{ r: 4, fill: palette.accent, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: palette.ink, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="No solved problems in the last 90 days." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
