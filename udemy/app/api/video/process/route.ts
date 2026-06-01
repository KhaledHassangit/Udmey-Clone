import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { processVideoToHls } from "@/lib/video-processor";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getBucket } from "@/lib/r2";
import { Readable } from "stream";

const schema = z.object({ lessonId: z.string().cuid() });

async function downloadFromR2(key: string, dest: string): Promise<void> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 not configured");
  }

  const client = new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ??
      `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const response = await client.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );

  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  await writeFile(dest, Buffer.concat(chunks));
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole("INSTRUCTOR", "ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      include: {
        videoAsset: true,
        section: { include: { course: true } },
      },
    });

    if (!lesson?.videoAsset) {
      return NextResponse.json({ error: "No video" }, { status: 404 });
    }

    if (
      lesson.section.course.instructorId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workDir = join(tmpdir(), `lumina-dl-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });
    const localPath = join(workDir, "input.mp4");

    await downloadFromR2(lesson.videoAsset.originalKey, localPath);

    processVideoToHls(
      lesson.videoAsset.id,
      localPath,
      lesson.section.course.id,
      lesson.id
    ).catch(console.error);

    return NextResponse.json({ status: "processing" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
