import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole("INSTRUCTOR", "ADMIN");
    const { id } = await params;

    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.course.update({
      where: { id },
      data: { status: "PENDING_REVIEW" },
    });

    return NextResponse.json({ course: { ...updated, price: Number(updated.price) } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
