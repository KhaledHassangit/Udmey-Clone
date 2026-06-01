import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { CourseCard } from "@/components/course/course-card";
import { Suspense } from "react";
import { CourseFilters } from "@/components/course/course-filters";

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const where = {
    status: "PUBLISHED" as const,
    ...(sp.q && {
      OR: [
        { title: { contains: sp.q, mode: "insensitive" as const } },
        { description: { contains: sp.q, mode: "insensitive" as const } },
      ],
    }),
    ...(sp.category && { category: { slug: sp.category } }),
    ...(sp.difficulty && { difficulty: sp.difficulty as "BEGINNER" }),
    ...(sp.minRating && { averageRating: { gte: Number(sp.minRating) } }),
  };

  const courses = await db.course.findMany({
    where,
    take: 24,
    orderBy: { enrollmentCount: "desc" },
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold text-white">Explore courses</h1>
        <p className="mt-2 text-zinc-500">Find your next skill — filter by topic, level, or rating.</p>
      </div>

      <Suspense fallback={<div className="h-14 skeleton rounded-2xl" />}>
        <CourseFilters locale={locale} categories={categories} />
      </Suspense>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={{ ...course, price: Number(course.price) }}
            locale={locale}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <p className="py-20 text-center text-zinc-500">No courses match your filters.</p>
      )}
    </div>
  );
}
