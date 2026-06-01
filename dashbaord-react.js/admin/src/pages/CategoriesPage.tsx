import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number };
}

export function CategoriesPage() {
  const [name, setName] = useState("");
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => adminFetch<{ categories: Category[] }>("categories"),
  });

  const create = useMutation({
    mutationFn: () =>
      adminFetch("categories", {
        method: "POST",
        body: JSON.stringify({ name, slug: name.toLowerCase().replace(/\s+/g, "-") }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setName("");
    },
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Categories</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex gap-3 mb-8"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium"
        >
          Add
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.categories.map((c) => (
          <div
            key={c.id}
            className="border border-[var(--border)] p-4 bg-[var(--surface)]"
          >
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-[var(--muted)] font-mono mt-1">{c.slug}</p>
            <p className="text-xs text-[var(--accent)] mt-2">
              {c._count.courses} courses
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
