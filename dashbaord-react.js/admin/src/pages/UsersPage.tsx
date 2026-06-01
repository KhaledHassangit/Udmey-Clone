import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: { enrollments: number; courses: number };
}

export function UsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => adminFetch<{ users: User[] }>("users"),
  });

  const updateUser = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      role?: string;
      status?: string;
    }) =>
      adminFetch(`users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">User management</h1>
        <p className="text-sm text-[var(--muted)]">Ban, suspend, or change roles</p>
      </header>

      <div className="border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">
                  Loading...
                </td>
              </tr>
            )}
            {data?.users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name ?? "—"}</p>
                  <p className="text-xs text-[var(--muted)]">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateUser.mutate({ id: u.id, role: e.target.value })
                    }
                    className="bg-[var(--bg)] border border-[var(--border)] px-2 py-1 text-xs"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.status}
                    onChange={(e) =>
                      updateUser.mutate({ id: u.id, status: e.target.value })
                    }
                    className="bg-[var(--bg)] border border-[var(--border)] px-2 py-1 text-xs"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BANNED">Banned</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-xs">
                  {u._count.enrollments} enroll · {u._count.courses} courses
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-[var(--muted)]">
                  {u.id.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
