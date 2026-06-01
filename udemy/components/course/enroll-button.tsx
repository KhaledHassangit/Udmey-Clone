"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  locale: string;
  firstLessonId?: string;
}

export function EnrollButton({
  courseId,
  courseSlug,
  locale,
  firstLessonId,
}: EnrollButtonProps) {
  const router = useRouter();

  async function enroll() {
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    if (res.status === 401) {
      router.push(`/${locale}/auth/sign-in`);
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Enrollment failed");
      return;
    }

    toast.success("You're enrolled!");
    if (firstLessonId) {
      router.push(`/${locale}/learn/${courseSlug}/${firstLessonId}`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }

  return (
    <Button className="mt-4 w-full" size="lg" onClick={enroll}>
      Enroll now
    </Button>
  );
}
