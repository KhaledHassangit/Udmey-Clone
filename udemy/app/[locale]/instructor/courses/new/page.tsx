"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function NewCoursePage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    difficulty: "ALL_LEVELS",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/instructor/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to create course");
      return;
    }
    const { course } = await res.json();
    toast.success("Course created");
    router.push(`/${locale}/instructor/courses/${course.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white mb-8">New course</h1>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/5 p-8">
        <div>
          <label className="text-xs text-zinc-500">Title</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={6}
            className="mt-1 flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Price (USD)</label>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
        <select
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-300"
        >
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
          <option value="ALL_LEVELS">All levels</option>
        </select>
        <Button type="submit" disabled={loading} className="w-full">
          Create course
        </Button>
      </form>
    </div>
  );
}
