import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

const TTL = Number(process.env.VIDEO_TOKEN_TTL_SECONDS ?? 3600);

export async function createVideoAccessToken(
  userId: string,
  lessonId: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL * 1000);

  await db.videoAccessToken.create({
    data: { userId, lessonId, token, expiresAt },
  });

  return token;
}

export async function validateVideoAccessToken(
  token: string,
  userId: string,
  lessonId: string
): Promise<boolean> {
  const record = await db.videoAccessToken.findUnique({
    where: { token },
  });

  if (!record) return false;
  if (record.userId !== userId || record.lessonId !== lessonId) return false;
  if (record.expiresAt < new Date()) return false;

  return true;
}

export function signManifestUrl(
  manifestKey: string,
  userId: string,
  lessonId: string
): string {
  const secret = process.env.VIDEO_TOKEN_SECRET ?? "dev-secret";
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const payload = `${manifestKey}:${userId}:${lessonId}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyManifestSignature(
  encoded: string,
  manifestKey: string,
  userId: string,
  lessonId: string
): boolean {
  try {
    const secret = process.env.VIDEO_TOKEN_SECRET ?? "dev-secret";
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return false;

    const [key, uid, lid, expStr, sig] = parts;
    if (key !== manifestKey || uid !== userId || lid !== lessonId) return false;
    if (Number(expStr) < Math.floor(Date.now() / 1000)) return false;

    const payload = `${key}:${uid}:${lid}:${expStr}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
