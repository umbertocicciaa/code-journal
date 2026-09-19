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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeitnerBoxLabel } from "@/lib/leitner";

const difficultyColors = {
  EASY: "#34d399",
  MEDIUM: "#fbbf24",
  HARD: "#fb7185",
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
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-white/50">
      {message}
    </div>
  );
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const boxData = stats.byBox.map((row) => ({
    name: getLeitnerBoxLabel(row.leitnerBox),
    count: row.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total tracked</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">
            {stats.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Solved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">
            {stats.solved}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current streak</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">
            {stats.streaks.current} days
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Review accuracy</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">
            {Math.round(stats.reviewAccuracy.accuracy * 100)}%
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap days={stats.heatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By difficulty</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {stats.byDifficulty.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byDifficulty}
                    dataKey="count"
                    nameKey="difficulty"
                    innerRadius={60}
                    outerRadius={90}
                  >
                    {stats.byDifficulty.map((entry) => (
                      <Cell
                        key={entry.difficulty}
                        fill={difficultyColors[entry.difficulty]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="No problems tracked yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leitner distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {boxData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boxData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="Mark problems as solved to populate Leitner boxes." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top topics</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {stats.byTopic.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byTopic} layout="vertical">
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#38bdf8" radius={[0, 8, 8, 0]} />
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
          </CardHeader>
          <CardContent className="h-72">
            {stats.solvedOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.solvedOverTime}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
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
