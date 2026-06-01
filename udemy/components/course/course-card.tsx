import Link from "next/link";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CourseCardProps {
  course: {
    slug: string;
    title: string;
    thumbnail: string | null;
    price: number;
    averageRating: number;
    enrollmentCount: number;
    instructor: { name: string | null };
    category: { name: string } | null;
  };
  locale: string;
  variant?: "default" | "featured";
}

export function CourseCard({ course, locale, variant = "default" }: CourseCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className={`group relative flex flex-col overflow-hidden transition-all duration-300 ${
        isFeatured
          ? "rounded-2xl bg-gradient-to-b from-white/10 to-transparent p-[1px] hover:scale-[1.02]"
          : "rounded-xl hover:-translate-y-1"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-zinc-900 ${
          isFeatured ? "aspect-[16/10] rounded-2xl" : "aspect-video rounded-xl"
        }`}
      >
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={isFeatured ? "600px" : "300px"}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {course.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-zinc-200 backdrop-blur-md">
            {course.category.name}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-2 ${isFeatured ? "p-4" : "pt-3"}`}>
        <h3
          className={`font-medium leading-snug text-zinc-100 line-clamp-2 group-hover:text-white ${
            isFeatured ? "text-lg" : "text-sm"
          }`}
        >
          {course.title}
        </h3>
        <p className="text-xs text-zinc-500">{course.instructor.name}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {course.averageRating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollmentCount}
            </span>
          </div>
          <span className="text-sm font-semibold text-violet-300">
            {course.price === 0 ? "Free" : formatPrice(course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
