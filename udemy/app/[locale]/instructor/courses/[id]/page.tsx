"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ManageCoursePage() {
  const { id } = useParams<{ id: string }>();
  const [processing, setProcessing] = useState(false);

  async function triggerProcess(lessonId: string) {
    setProcessing(true);
    const res = await fetch("/api/video/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    setProcessing(false);
    if (res.ok) toast.success("Video processing started");
    else toast.error("Processing failed");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Manage course</h1>
      <p className="text-zinc-500 text-sm mb-8 font-mono">{id}</p>
      <div className="rounded-2xl border border-white/5 p-6 space-y-4">
        <p className="text-sm text-zinc-400">
          Upload videos via presigned R2 URL, then trigger HLS processing per lesson.
        </p>
        <Button
          variant="secondary"
          disabled={processing}
          onClick={() => {
            const lessonId = prompt("Lesson ID to process:");
            if (lessonId) triggerProcess(lessonId);
          }}
        >
          Process video (FFmpeg HLS)
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const res = await fetch(`/api/instructor/courses/${id}/submit`, {
              method: "POST",
            });
            if (res.ok) toast.success("Submitted for admin review");
            else toast.error("Submit failed");
          }}
        >
          Submit for review
        </Button>
      </div>
    </div>
  );
}
