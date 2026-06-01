import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/video-access";
import { createVideoAccessToken, signManifestUrl } from "@/lib/video-token";
import { rateLimit } from "@/lib/redis";

const schema = z.object({ lessonId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await rateLimit(`stream:${session.user.id}`, 30, 60);
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, email: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canAccessLesson(
    session.user.id,
    parsed.data.lessonId,
    user.role
  );

  if (!allowed) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  const videoAsset = await db.videoAsset.findUnique({
    where: { lessonId: parsed.data.lessonId },
  });

  if (!videoAsset?.hlsManifestKey || videoAsset.processingStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "Video not ready", status: videoAsset?.processingStatus },
      { status: 404 }
    );
  }

  const accessToken = await createVideoAccessToken(
    session.user.id,
    parsed.data.lessonId
  );

  const signedManifest = signManifestUrl(
    videoAsset.hlsManifestKey,
    session.user.id,
    parsed.data.lessonId
  );

  const manifestUrl = `/api/video/manifest?lessonId=${parsed.data.lessonId}&sig=${signedManifest}&token=${accessToken}`;

  return NextResponse.json({
    manifestUrl,
    qualities: videoAsset.qualities,
    watermark: user.email,
  });
}
