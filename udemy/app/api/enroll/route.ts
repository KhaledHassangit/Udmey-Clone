import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { rateLimit } from "@/lib/redis";

const schema = z.object({ courseId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`enroll:${session.user.id}`, 10, 3600);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course unavailable" }, { status: 404 });
  }

  const enrollment = await db.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
    create: { userId: session.user.id, courseId: course.id },
    update: { status: "ACTIVE" },
  });

  await db.course.update({
    where: { id: course.id },
    data: { enrollmentCount: { increment: 1 } },
  });

  return NextResponse.json({ enrollment });
}
