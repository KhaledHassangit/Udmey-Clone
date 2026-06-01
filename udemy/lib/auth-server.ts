import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole, UserStatus } from "@prisma/client";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true, role: true, status: true, locale: true },
  });
  if (!user || user.status !== "ACTIVE") {
    throw new Error("UNAUTHORIZED");
  }
  return { session, user };
}

export async function requireRole(...roles: UserRole[]) {
  const { session, user } = await requireSession();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return { session, user };
}

export function assertActive(status: UserStatus) {
  if (status !== "ACTIVE") throw new Error("ACCOUNT_SUSPENDED");
}
