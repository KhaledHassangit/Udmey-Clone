import { timingSafeEqual } from "crypto";

export function verifyAdminApiSecret(header: string | null): boolean {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret || !header) return false;

  try {
    const a = Buffer.from(header);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
