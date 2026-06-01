import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getUploadSignedUrl, buildVideoKey } from "@/lib/r2";
import { rateLimit } from "@/lib/redis";

const schema = z.object({
  lessonId: z.string().cuid(),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^video\//),
});

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole("INSTRUCTOR", "ADMIN");
    const { success } = await rateLimit(`upload:${user.id}`, 20, 3600);
    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      include: { section: { include: { course: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (
      lesson.section.course.instructorId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const key = buildVideoKey(
      lesson.section.course.id,
      lesson.id,
      parsed.data.filename
    );

    const uploadUrl = await getUploadSignedUrl(key, parsed.data.contentType);
    if (!uploadUrl) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }

    await db.videoAsset.upsert({
      where: { lessonId: lesson.id },
      create: {
        lessonId: lesson.id,
        originalKey: key,
        processingStatus: "PENDING",
      },
      update: {
        originalKey: key,
        processingStatus: "PENDING",
        hlsManifestKey: null,
      },
    });

    return NextResponse.json({ uploadUrl, key });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
