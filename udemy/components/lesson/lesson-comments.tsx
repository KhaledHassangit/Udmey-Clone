"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LessonComments({ lessonId }: { lessonId: string }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["comments", lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: text }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", lessonId] });
      setContent("");
    },
  });

  const comments = data?.comments ?? [];

  return (
    <section className="rounded-2xl border border-white/5 p-6">
      <h3 className="font-display text-lg font-semibold text-white mb-6">
        Discussion ({comments.length})
      </h3>
      <div className="flex gap-3 mb-8">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ask a question or share insight..."
        />
        <Button onClick={() => mutation.mutate(content)} disabled={!content.trim()}>
          Post
        </Button>
      </div>
      <div className="space-y-6">
        {comments.map((c: {
          id: string;
          content: string;
          user: { name: string | null };
          createdAt: string;
          replies: { id: string; content: string; user: { name: string | null } }[];
        }) => (
          <div key={c.id} className="border-l-2 border-violet-500/30 pl-4">
            <p className="text-sm font-medium text-zinc-300">{c.user.name ?? "Student"}</p>
            <p className="mt-1 text-zinc-400">{c.content}</p>
            {c.replies?.map((r) => (
              <div key={r.id} className="mt-3 ml-4 text-sm text-zinc-500">
                <span className="text-zinc-400">{r.user.name}: </span>
                {r.content}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
