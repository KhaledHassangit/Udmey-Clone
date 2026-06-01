import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

export function LogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () =>
      adminFetch<{
        logs: {
          id: string;
          level: string;
          action: string;
          message: string;
          createdAt: string;
        }[];
      }>("analytics"),
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">System logs</h1>
      </header>
      <div className="font-mono text-xs border border-[var(--border)] divide-y divide-[var(--border)]">
        {isLoading && (
          <p className="p-4 text-[var(--muted)]">Loading...</p>
        )}
        {data?.logs.map((log) => (
          <div key={log.id} className="px-4 py-3 flex gap-4">
            <span className="text-[var(--accent)] w-24 shrink-0">{log.level}</span>
            <span className="text-[var(--warn)] w-32 shrink-0">{log.action}</span>
            <span className="text-[var(--muted)] flex-1 truncate">{log.message}</span>
            <span className="text-[var(--muted)] shrink-0">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
