const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
function getSecret(): string {
  if (typeof sessionStorage !== "undefined") {
    const override = sessionStorage.getItem("lumina_admin_secret_override");
    if (override) return override;
  }
  return import.meta.env.VITE_ADMIN_API_SECRET ?? "";
}

export function hasAdminSecret(): boolean {
  return Boolean(getSecret());
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}/api/admin/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": getSecret(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}
