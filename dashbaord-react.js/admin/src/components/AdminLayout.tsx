import { NavLink, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tags,
  MessageSquare,
  ScrollText,
} from "lucide-react";
import { hasAdminSecret } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/comments", icon: MessageSquare, label: "Comments" },
  { to: "/logs", icon: ScrollText, label: "System logs" },
];

export function AdminLayout() {
  const secretOk =
    hasAdminSecret() ||
    Boolean(sessionStorage.getItem("lumina_admin_secret_override"));

  if (!secretOk) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            Lumina
          </p>
          <h1 className="text-lg font-semibold tracking-tight">Control</h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.03]"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-4 text-[10px] text-[var(--muted)] font-mono">
          v1.0 · isolated admin
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
