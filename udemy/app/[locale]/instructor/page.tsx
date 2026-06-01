import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users } from "lucide-react";

export default async function InstructorStudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("instructor");
  const { user } = await requireRole("INSTRUCTOR", "ADMIN");

  const courses = await db.course.findMany({
    where: { instructorId: user.id },
    include: { _count: { select: { enrollments: true, sections: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const totalStudents = courses.reduce((a, c) => a + c._count.enrollments, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-violet-400">Creator Studio</p>
          <h1 className="font-display text-4xl font-bold text-white">{t("studio")}</h1>
        </div>
        <Button asChild>
          <Link href={`/${locale}/instructor/courses/new`}>
            <Plus className="h-4 w-4" />
            {t("createCourse")}
          </Link>
        </Button>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-violet-950/50 to-transparent p-6">
          <BarChart3 className="h-5 w-5 text-violet-400 mb-3" />
          <p className="text-3xl font-bold text-white">{courses.length}</p>
          <p className="text-sm text-zinc-500">Courses</p>
        </div>
        <div className="rounded-2xl border border-white/5 p-6">
          <Users className="h-5 w-5 text-fuchsia-400 mb-3" />
          <p className="text-3xl font-bold text-white">{totalStudents}</p>
          <p className="text-sm text-zinc-500">{t("students")}</p>
        </div>
        <div className="rounded-2xl border border-white/5 p-6">
          <p className="text-3xl font-bold text-white">
            {courses.filter((c) => c.status === "PUBLISHED").length}
          </p>
          <p className="text-sm text-zinc-500">Published</p>
        </div>
      </div>

      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between rounded-xl border border-white/5 px-6 py-4 hover:bg-white/[0.02]"
          >
            <div>
              <h3 className="font-medium text-white">{course.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {course.status} · {course._count.enrollments} students
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/${locale}/instructor/courses/${course.id}`}>Manage</Link>
            </Button>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="py-12 text-center text-zinc-500">Create your first course to get started.</p>
        )}
      </div>
    </div>
  );
}
