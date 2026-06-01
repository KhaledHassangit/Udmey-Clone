import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { EnrollButton } from "@/components/course/enroll-button";
import { Star, Clock, BookOpen } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("course");

  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      instructor: { select: { id: true, name: true, image: true, bio: true } },
      category: true,
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!course) notFound();

  const totalLessons = course.sections.reduce((a, s) => a + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (a, s) => a + s.lessons.reduce((b, l) => b + l.duration, 0),
    0
  );
  const firstLesson = course.sections[0]?.lessons[0];

  return (
    <div className="pb-20">
      <section className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {course.category && (
              <span className="text-sm text-violet-400">{course.category.name}</span>
            )}
            <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
              {course.title}
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">{course.shortDescription ?? course.description.slice(0, 200)}</p>
            <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {course.averageRating.toFixed(1)} ({course.reviewCount} {t("reviews")})
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {totalLessons} {t("lessons")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(totalDuration)}
              </span>
            </div>
            <div className="flex items-center gap-4 pt-2">
              {course.instructor.image && (
                <Image
                  src={course.instructor.image}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-xs text-zinc-500">{t("instructor")}</p>
                <p className="font-medium text-white">{course.instructor.name}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl lg:sticky lg:top-24 lg:self-start">
            {course.thumbnail && (
              <div className="relative mb-4 aspect-video overflow-hidden rounded-xl">
                <Image src={course.thumbnail} alt="" fill className="object-cover" />
              </div>
            )}
            <p className="text-3xl font-bold text-white">
              {Number(course.price) === 0 ? "Free" : formatPrice(Number(course.price))}
            </p>
            <EnrollButton
              courseId={course.id}
              courseSlug={course.slug}
              locale={locale}
              firstLessonId={firstLesson?.id}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-white mb-8">{t("curriculum")}</h2>
        <div className="space-y-4">
          {course.sections.map((section, i) => (
            <div key={section.id} className="rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-white/[0.03] px-6 py-4 font-medium text-zinc-200">
                Section {i + 1}: {section.title}
              </div>
              <ul className="divide-y divide-white/5">
                {section.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span className="text-zinc-400">{lesson.title}</span>
                    <span className="text-zinc-600">
                      {lesson.isPreview ? t("preview") : formatDuration(lesson.duration)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
