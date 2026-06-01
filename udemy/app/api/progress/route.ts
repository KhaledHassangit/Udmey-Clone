import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { progressSchema } from "@/lib/validations";
import { canAccessLesson } from "@/lib/video-access";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { lessonId, ...rest } = body;
  const parsed = progressSchema.safeParse(rest);
  if (!parsed.success || !lessonId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canAccessLesson(session.user.id, lessonId, user.role);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: {
      userId: session.user.id,
      lessonId,
      watchedSeconds: parsed.data.watchedSeconds,
      completed: parsed.data.completed ?? false,
    },
    update: {
      watchedSeconds: parsed.data.watchedSeconds,
      completed: parsed.data.completed,
      lastWatchedAt: new Date(),
    },
  });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { section: { select: { courseId: true } } },
  });

  if (lesson && parsed.data.completed) {
    const courseId = lesson.section.courseId;
    const [totalLessons, completedLessons] = await Promise.all([
      db.lesson.count({
        where: { section: { courseId } },
      }),
      db.lessonProgress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: { section: { courseId } },
        },
      }),
    ]);

    const progressPct =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await db.enrollment.update({
      where: {
        userId_courseId: { userId: session.user.id, courseId },
      },
      data: { progress: progressPct },
    });
  }

  return NextResponse.json({ progress });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const progress = await db.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: { section: { courseId } },
    },
    include: {
      lesson: { select: { id: true, title: true, slug: true, duration: true } },
    },
    orderBy: { lastWatchedAt: "desc" },
  });

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  return NextResponse.json({ progress, courseProgress: enrollment?.progress ?? 0 });
}
