import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await rateLimit(`courses:${ip}`, 60, 60);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = searchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { q, category, instructor, difficulty, minRating, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    status: "PUBLISHED" as const,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category: { slug: category } }),
    ...(instructor && { instructorId: instructor }),
    ...(difficulty && { difficulty }),
    ...(minRating && { averageRating: { gte: minRating } }),
  };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { enrollmentCount: "desc" },
      include: {
        instructor: { select: { id: true, name: true, image: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      ...c,
      price: Number(c.price),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
