import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true, image: true, bio: true } },
      category: true,
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              duration: true,
              isPreview: true,
              sortOrder: true,
            },
          },
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...course,
    price: Number(course.price),
  });
}
