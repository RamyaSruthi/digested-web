import { z } from "zod";

export const createLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  image_url: z.string().optional().nullable(),
  folder_id: z.string().uuid().optional().nullable(),
  reading_time_minutes: z.number().int().positive().optional().nullable(),
});

export const updateLinkSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  folder_id: z.string().uuid().optional().nullable(),
  status: z.enum(["unread", "digested", "archived"]).optional(),
  digested_at: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  scroll_progress: z.number().int().min(0).max(100).optional(),
});

export const linkFiltersSchema = z.object({
  status: z.enum(["unread", "digested", "archived"]).optional(),
  folder_id: z.string().uuid().optional(),
  has_notes: z.boolean().optional(),
  content_type: z.enum(["article", "video", "tweet", "pdf"]).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type LinkFilters = z.infer<typeof linkFiltersSchema>;
