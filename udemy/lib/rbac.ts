import type { UserRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
};

export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export const ROUTE_PERMISSIONS = {
  "/instructor": ["INSTRUCTOR", "ADMIN"] as UserRole[],
  "/admin-api": ["ADMIN"] as UserRole[],
  "/learn": ["STUDENT", "INSTRUCTOR", "ADMIN"] as UserRole[],
} as const;
