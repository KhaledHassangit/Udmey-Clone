import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { courseCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const { user } = await requireRole("INSTRUCTOR", "ADMIN");
    const courses = await db.course.findMany({
      where: { instructorId: user.id },
      include: {
        category: true,
        _count: { select: { enrollments: true, sections: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      courses: courses.map((c) => ({ ...c, price: Number(c.price) })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole("INSTRUCTOR", "ADMIN");
    const body = await req.json();
    const parsed = courseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    let slug = slugify(parsed.data.title);
    const existing = await db.course.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const course = await db.course.create({
      data: {
        ...parsed.data,
        slug,
        instructorId: user.id,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ course: { ...course, price: Number(course.price) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
