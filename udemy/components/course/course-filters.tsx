"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

interface CourseFiltersProps {
  locale: string;
  categories: { id: string; name: string; slug: string }[];
}

export function CourseFilters({ locale, categories }: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/${locale}/courses?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <Input
        placeholder="Search courses..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="max-w-xs"
      />
      <select
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-300"
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-300"
        defaultValue={searchParams.get("difficulty") ?? ""}
        onChange={(e) => update("difficulty", e.target.value)}
      >
        <option value="">All levels</option>
        <option value="BEGINNER">Beginner</option>
        <option value="INTERMEDIATE">Intermediate</option>
        <option value="ADVANCED">Advanced</option>
      </select>
      <select
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-300"
        defaultValue={searchParams.get("minRating") ?? ""}
        onChange={(e) => update("minRating", e.target.value)}
      >
        <option value="">Any rating</option>
        <option value="4">4+ stars</option>
        <option value="4.5">4.5+ stars</option>
      </select>
    </div>
  );
}
