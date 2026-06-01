import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/video-access";
import {
  validateVideoAccessToken,
  verifyManifestSignature,
} from "@/lib/video-token";
import { getDownloadSignedUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  const sig = req.nextUrl.searchParams.get("sig");
  const token = req.nextUrl.searchParams.get("token");

  if (!lessonId || !sig || !token) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  const validToken = await validateVideoAccessToken(
    token,
    session.user.id,
    lessonId
  );
  if (!validToken) {
    return NextResponse.json({ error: "Token expired" }, { status: 403 });
  }

  const videoAsset = await db.videoAsset.findUnique({
    where: { lessonId },
  });

  if (!videoAsset?.hlsManifestKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    !verifyManifestSignature(
      sig,
      videoAsset.hlsManifestKey,
      session.user.id,
      lessonId
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const signedUrl = await getDownloadSignedUrl(videoAsset.hlsManifestKey, 300);

  if (signedUrl) {
    return NextResponse.redirect(signedUrl);
  }

  const manifest = await fetch(
    `${process.env.R2_PUBLIC_URL}/${videoAsset.hlsManifestKey}`
  ).catch(() => null);

  if (!manifest?.ok) {
    return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
  }

  const text = await manifest.text();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "private, no-store",
    },
  });
}
