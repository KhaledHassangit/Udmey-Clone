import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export function LoginGate() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) {
      setError("Enter admin API secret");
      return;
    }
    sessionStorage.setItem("lumina_admin_secret_override", secret);
    navigate("/");
    window.location.reload();
  }

  const envSet = Boolean(import.meta.env.VITE_ADMIN_API_SECRET);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[var(--accent-dim)]">
            <Shield className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Lumina Control</h1>
            <p className="text-xs text-[var(--muted)]">Admin access only</p>
          </div>
        </div>

        {envSet ? (
          <p className="mb-4 text-sm text-[var(--muted)]">
            API secret is configured via environment.{" "}
            <button
              type="button"
              className="text-[var(--accent)] underline"
              onClick={() => navigate("/")}
            >
              Continue to dashboard
            </button>
          </p>
        ) : (
          <p className="mb-4 text-sm text-[var(--muted)]">
            Set <code className="font-mono text-xs">VITE_ADMIN_API_SECRET</code> in .env or enter it below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_API_SECRET"
            className="w-full border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--bg)]"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
