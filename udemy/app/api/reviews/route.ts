import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { sanitizePlainText } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const reviews = await db.review.findMany({
    where: { courseId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { courseId, ...rest } = body;
  const parsed = reviewSchema.safeParse(rest);
  if (!parsed.success || !courseId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Must be enrolled" }, { status: 403 });
  }

  const review = await db.review.upsert({
    where: {
      userId_courseId: { userId: session.user.id, courseId },
    },
    create: {
      userId: session.user.id,
      courseId,
      rating: parsed.data.rating,
      content: parsed.data.content
        ? sanitizePlainText(parsed.data.content)
        : null,
    },
    update: {
      rating: parsed.data.rating,
      content: parsed.data.content
        ? sanitizePlainText(parsed.data.content)
        : null,
    },
  });

  const agg = await db.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: true,
  });

  await db.course.update({
    where: { id: courseId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });

  return NextResponse.json({ review });
}
