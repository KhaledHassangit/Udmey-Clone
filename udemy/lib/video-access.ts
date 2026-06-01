import { db } from "@/lib/db";

export async function canAccessLesson(
  userId: string,
  lessonId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === "ADMIN") return true;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: { include: { course: true } },
    },
  });

  if (!lesson) return false;

  if (lesson.isPreview) return true;

  const course = lesson.section.course;

  if (course.instructorId === userId && userRole === "INSTRUCTOR") {
    return true;
  }

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId: course.id },
    },
  });

  return enrollment?.status === "ACTIVE";
}
