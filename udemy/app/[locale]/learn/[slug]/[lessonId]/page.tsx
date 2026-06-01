import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/video-access";
import { HlsPlayer } from "@/components/video/hls-player";
import { LessonComments } from "@/components/lesson/lesson-comments";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}) {
  const { locale, slug, lessonId } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const allowed = await canAccessLesson(user.id, lessonId, user.role);
  if (!allowed) redirect(`/${locale}/courses/${slug}`);

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { videoAsset: true },
  });

  if (!course || !lesson) notFound();

  const progress = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = allLessons[currentIndex + 1];

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/${locale}/dashboard`} className="hover:text-zinc-300">
            My Learning
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{course.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {lesson.type === "VIDEO" ? (
              <HlsPlayer
                lessonId={lessonId}
                initialPosition={progress?.watchedSeconds ?? 0}
              />
            ) : (
              <article
                className="prose prose-invert max-w-none rounded-2xl border border-white/5 p-8"
                dangerouslySetInnerHTML={{ __html: lesson.content ?? "" }}
              />
            )}

            <div>
              <h1 className="font-display text-2xl font-bold text-white">{lesson.title}</h1>
              {lesson.description && (
                <p className="mt-2 text-zinc-400">{lesson.description}</p>
              )}
            </div>

            {nextLesson && (
              <Link
                href={`/${locale}/learn/${slug}/${nextLesson.id}`}
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300"
              >
                Next: {nextLesson.title} →
              </Link>
            )}

            <LessonComments lessonId={lessonId} />
          </div>

          <aside className="rounded-2xl border border-white/5 bg-zinc-900/30 p-4 lg:sticky lg:top-24 lg:self-start max-h-[70vh] overflow-y-auto">
            <h2 className="mb-4 text-sm font-medium text-zinc-400">Course content</h2>
            {course.sections.map((section) => (
              <div key={section.id} className="mb-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">{section.title}</p>
                <ul className="space-y-1">
                  {section.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/${locale}/learn/${slug}/${l.id}`}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          l.id === lessonId
                            ? "bg-violet-500/20 text-violet-200"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                      >
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
