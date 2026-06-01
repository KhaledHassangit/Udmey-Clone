import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/validations";
import { sanitizePlainText } from "@/lib/sanitize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isOwner = comment.userId === session.user.id;
  const isModerator =
    user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  if (!isOwner && !isModerator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.isHidden !== undefined && isModerator) {
    const updated = await db.comment.update({
      where: { id },
      data: {
        isHidden: body.isHidden,
        moderatedBy: session.user.id,
        moderatedAt: new Date(),
      },
    });
    return NextResponse.json({ comment: updated });
  }

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await db.comment.update({
    where: { id },
    data: { content: sanitizePlainText(parsed.data.content) },
  });

  return NextResponse.json({ comment: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (
    comment.userId !== session.user.id &&
    user?.role !== "INSTRUCTOR" &&
    user?.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
