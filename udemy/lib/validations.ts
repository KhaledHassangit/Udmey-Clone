import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(10000),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0).max(9999),
  categoryId: z.string().cuid().optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]),
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(["VIDEO", "TEXT"]),
  content: z.string().max(50000).optional(),
  isPreview: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().cuid().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
});

export const progressSchema = z.object({
  watchedSeconds: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export const searchSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  instructor: z.string().optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
});

export const adminCourseReviewSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
  rejectionReason: z.string().max(1000).optional(),
});
