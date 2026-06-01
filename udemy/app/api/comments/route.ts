import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/validations";
import { sanitizePlainText } from "@/lib/sanitize";
import { canAccessLesson } from "@/lib/video-access";

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const comments = await db.comment.findMany({
    where: { lessonId, parentId: null, isHidden: false },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
      replies: {
        where: { isHidden: false },
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { lessonId, ...rest } = body;
  const parsed = commentSchema.safeParse(rest);
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

  const comment = await db.comment.create({
    data: {
      lessonId,
      userId: session.user.id,
      parentId: parsed.data.parentId,
      content: sanitizePlainText(parsed.data.content),
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
