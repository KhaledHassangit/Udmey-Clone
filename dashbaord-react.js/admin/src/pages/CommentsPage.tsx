import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface Comment {
  id: string;
  content: string;
  user: { email: string; name: string | null };
  lesson: { title: string };
}

export function CommentsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["comments"],
    queryFn: () => adminFetch<{ comments: Comment[] }>("comments"),
  });

  const hide = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`comments/${id}`, { method: "PATCH", body: "{}" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments"] }),
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Comment moderation</h1>
      </header>
      <div className="space-y-4">
        {data?.comments.map((c) => (
          <div
            key={c.id}
            className="border border-[var(--border)] p-4 flex justify-between gap-4"
          >
            <div>
              <p className="text-sm">{c.content}</p>
              <p className="text-xs text-[var(--muted)] mt-2">
                {c.user.name ?? c.user.email} · {c.lesson.title}
              </p>
            </div>
            <button
              onClick={() => hide.mutate(c.id)}
              className="shrink-0 px-3 py-1 text-xs border border-[var(--danger)] text-[var(--danger)] h-fit"
            >
              Hide
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
