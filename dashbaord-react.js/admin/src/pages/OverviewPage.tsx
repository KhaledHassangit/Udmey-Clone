import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsResponse {
  analytics: {
    totalUsers: number;
    publishedCourses: number;
    totalEnrollments: number;
  };
  logs: { id: string; level: string; action: string; message: string; createdAt: string }[];
}

export function OverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => adminFetch<AnalyticsResponse>("analytics"),
  });

  const stats = data?.analytics;
  const chartData = stats
    ? [
        { name: "Users", value: stats.totalUsers },
        { name: "Courses", value: stats.publishedCourses },
        { name: "Enrollments", value: stats.totalEnrollments },
      ]
    : [];

  return (
    <div className="p-8">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Real-time snapshot of Lumina Learn
        </p>
      </header>

      {error && (
        <div className="mb-6 border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {(error as Error).message}. Check API URL and admin secret.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {[
          { label: "Total users", value: stats?.totalUsers },
          { label: "Published courses", value: stats?.publishedCourses },
          { label: "Enrollments", value: stats?.totalEnrollments },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
              {s.label}
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">
              {isLoading ? "—" : s.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6 h-72">
          <h2 className="text-sm font-medium mb-4">Distribution</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#111118",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              />
              <Bar dataKey="value" fill="#22d3ee" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-sm font-medium">Recent activity</h2>
          </div>
          <ul className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
            {(data?.logs ?? []).slice(0, 8).map((log) => (
              <li key={log.id} className="px-6 py-3 text-sm">
                <span className="font-mono text-[10px] text-[var(--accent)]">
                  {log.action}
                </span>
                <p className="text-[var(--muted)] truncate mt-0.5">{log.message}</p>
              </li>
            ))}
            {!data?.logs?.length && !isLoading && (
              <li className="px-6 py-8 text-center text-[var(--muted)] text-sm">
                No logs yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
