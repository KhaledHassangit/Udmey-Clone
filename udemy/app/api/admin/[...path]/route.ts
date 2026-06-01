import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiSecret } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adminUserUpdateSchema, adminCourseReviewSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/redis";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const secret = req.headers.get("x-admin-secret");
  if (!verifyAdminApiSecret(secret)) return unauthorized();

  const ip = req.headers.get("x-forwarded-for") ?? "admin";
  const { success } = await rateLimit(`admin:${ip}`, 120, 60);
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { path } = await params;
  const resource = path[0];

  switch (resource) {
    case "users": {
      const users = await db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { enrollments: true, courses: true } },
        },
      });
      return NextResponse.json({ users });
    }
    case "courses": {
      const status = req.nextUrl.searchParams.get("status");
      const courses = await db.course.findMany({
        where: status ? { status: status as "PENDING_REVIEW" } : undefined,
        include: {
          instructor: { select: { name: true, email: true } },
          category: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return NextResponse.json({
        courses: courses.map((c) => ({ ...c, price: Number(c.price) })),
      });
    }
    case "categories": {
      const categories = await db.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { courses: true } } },
      });
      return NextResponse.json({ categories });
    }
    case "comments": {
      const comments = await db.comment.findMany({
        where: { isHidden: false },
        include: {
          user: { select: { email: true, name: true } },
          lesson: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ comments });
    }
    case "analytics": {
      const [users, courses, enrollments, revenue] = await Promise.all([
        db.user.count(),
        db.course.count({ where: { status: "PUBLISHED" } }),
        db.enrollment.count(),
        db.course.aggregate({
          _sum: { enrollmentCount: true },
        }),
      ]);
      const recentLogs = await db.systemLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({
        analytics: {
          totalUsers: users,
          publishedCourses: courses,
          totalEnrollments: enrollments,
          totalEnrollmentsSum: revenue._sum.enrollmentCount ?? 0,
        },
        logs: recentLogs,
      });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const secret = req.headers.get("x-admin-secret");
  if (!verifyAdminApiSecret(secret)) return unauthorized();

  const { path } = await params;
  const [resource, id] = path;
  const body = await req.json();

  if (resource === "users" && id) {
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const user = await db.user.update({
      where: { id },
      data: parsed.data,
    });
    await db.systemLog.create({
      data: {
        level: "info",
        action: "USER_UPDATE",
        message: `Admin updated user ${id}`,
        metadata: parsed.data,
      },
    });
    return NextResponse.json({ user });
  }

  if (resource === "courses" && id) {
    const parsed = adminCourseReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const course = await db.course.update({
      where: { id },
      data: {
        status: parsed.data.status,
        rejectionReason: parsed.data.rejectionReason,
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    return NextResponse.json({ course: { ...course, price: Number(course.price) } });
  }

  if (resource === "comments" && id) {
    const comment = await db.comment.update({
      where: { id },
      data: { isHidden: true, moderatedAt: new Date() },
    });
    return NextResponse.json({ comment });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const secret = req.headers.get("x-admin-secret");
  if (!verifyAdminApiSecret(secret)) return unauthorized();

  const { path } = await params;
  const [resource] = path;
  const body = await req.json();

  if (resource === "categories") {
    const category = await db.category.create({
      data: {
        name: body.name,
        slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-"),
        description: body.description,
        icon: body.icon,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
