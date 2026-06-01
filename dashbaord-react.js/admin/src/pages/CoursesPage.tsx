import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  status: string;
  instructor: { name: string | null; email: string };
  price: number;
  enrollmentCount: number;
}

export function CoursesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => adminFetch<{ courses: Course[] }>("courses?status=PENDING_REVIEW"),
  });

  const allCourses = useQuery({
    queryKey: ["admin-courses-all"],
    queryFn: () => adminFetch<{ courses: Course[] }>("courses"),
  });

  const review = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: string;
      rejectionReason?: string;
    }) =>
      adminFetch(`courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["admin-courses-all"] });
    },
  });

  const pending = data?.courses ?? [];
  const all = allCourses.data?.courses ?? [];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Course approval</h1>
        <p className="text-sm text-[var(--muted)]">
          {pending.length} pending review
        </p>
      </header>

      {pending.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs uppercase tracking-wider text-[var(--warn)] mb-4">
            Pending review
          </h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border border-[var(--warn)]/20 bg-[var(--warn)]/5 p-4"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {c.instructor.name} · ${c.price}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: c.id, status: "PUBLISHED" })}
                    className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--bg)] font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      review.mutate({
                        id: c.id,
                        status: "REJECTED",
                        rejectionReason: "Does not meet guidelines",
                      })
                    }
                    className="px-4 py-2 text-xs border border-[var(--danger)] text-[var(--danger)]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium mb-4">All courses</h2>
        {isLoading && <p className="text-[var(--muted)]">Loading...</p>}
        <div className="border border-[var(--border)] divide-y divide-[var(--border)]">
          {all.map((c) => (
            <div key={c.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{c.title}</span>
              <span className="font-mono text-xs text-[var(--muted)]">
                {c.status} · {c.enrollmentCount} students
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
