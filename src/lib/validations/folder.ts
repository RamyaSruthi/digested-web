import { z } from "zod";

export const FOLDER_COLORS = [
  "#7F77DD",
  "#1D9E75",
  "#BA7517",
  "#E05252",
  "#4A90D9",
  "#9B59B6",
  "#E67E22",
  "#2ECC71",
] as const;

export type FolderColor = (typeof FOLDER_COLORS)[number];

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name must be 50 characters or less")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
