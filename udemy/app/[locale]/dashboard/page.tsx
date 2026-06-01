import Link from "next/link";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Play } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const { user } = await requireSession();

  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          sections: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId: user.id },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const continueItems = enrollments
    .map((e) => {
      const lessons = e.course.sections.flatMap((s) => s.lessons);
      const inProgress = lessons.find(
        (l) => l.progress[0] && !l.progress[0].completed
      );
      const lastLesson = inProgress ?? lessons[0];
      return lastLesson
        ? {
            course: e.course,
            lesson: lastLesson,
            progress: e.progress,
          }
        : null;
    })
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-zinc-500">Welcome back, {user.name ?? user.email}</p>
      </div>

      {continueItems.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Continue watching
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {continueItems.map(
              (item) =>
                item && (
                  <Link
                    key={item.course.id}
                    href={`/${locale}/learn/${item.course.slug}/${item.lesson.id}`}
                    className="group flex gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-violet-950/30 to-transparent p-5 transition-all hover:border-violet-500/30"
                  >
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                      {item.course.thumbnail && (
                        <Image src={item.course.thumbnail} alt="" fill className="object-cover" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-violet-400">{item.lesson.title}</p>
                      <h3 className="font-medium text-white truncate">{item.course.title}</h3>
                      <Progress value={item.progress} className="mt-3" />
                      <p className="mt-1 text-xs text-zinc-500">{Math.round(item.progress)}% complete</p>
                    </div>
                  </Link>
                )
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-6 font-display text-2xl font-semibold text-white">
          {t("enrolled")}
        </h2>
        {enrollments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
            {t("empty")}{" "}
            <Link href={`/${locale}/courses`} className="text-violet-400 hover:underline">
              Browse courses
            </Link>
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/${locale}/courses/${e.course.slug}`}
                className="rounded-2xl border border-white/5 p-5 transition-colors hover:bg-white/[0.02]"
              >
                <h3 className="font-medium text-white">{e.course.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{e.course.instructor.name}</p>
                <Progress value={e.progress} className="mt-4" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
