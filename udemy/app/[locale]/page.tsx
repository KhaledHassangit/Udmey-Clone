import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course/course-card";
import { ArrowRight, Play } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [featured, categories] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      take: 4,
      orderBy: { enrollmentCount: "desc" },
      include: {
        instructor: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    db.category.findMany({
      take: 8,
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { courses: true } } },
    }),
  ]);

  const heroCourse = featured[0];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[100px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cinema-quality HLS streaming
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-lg text-lg text-zinc-400 leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href={`/${locale}/courses`}>
                  {t("ctaExplore")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${locale}/auth/sign-up`}>{t("ctaStart")}</Link>
              </Button>
            </div>
          </div>

          {heroCourse && (
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm">
                <CourseCard
                  course={{
                    ...heroCourse,
                    price: Number(heroCourse.price),
                  }}
                  locale={locale}
                  variant="featured"
                />
                <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                  <Play className="h-4 w-4 text-violet-400" />
                  Adaptive 360p → 1080p streaming
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="border-t border-white/5 bg-zinc-950/50 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-8 font-display text-2xl font-semibold text-white">
              {t("categories")}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${locale}/courses?category=${cat.slug}`}
                  className="shrink-0 rounded-2xl border border-white/5 bg-white/5 px-6 py-4 transition-all hover:border-violet-500/30 hover:bg-violet-500/10"
                >
                  <span className="font-medium text-zinc-200">{cat.name}</span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {cat._count.courses} courses
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold text-white">
            {t("featured")}
          </h2>
          <Link
            href={`/${locale}/courses`}
            className="text-sm text-violet-400 hover:text-violet-300"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((course) => (
            <CourseCard
              key={course.id}
              course={{ ...course, price: Number(course.price) }}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
