import { z } from "zod";

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 - Square" },
  { value: "4:3", label: "4:3 - Standard" },
  { value: "3:2", label: "3:2 - Classic Photo" },
  { value: "2:3", label: "2:3 - Portrait Photo" },
  { value: "5:4", label: "5:4 - Large Format" },
  { value: "4:5", label: "4:5 - Portrait" },
  { value: "3:4", label: "3:4 - Vertical" },
  { value: "16:9", label: "16:9 - Widescreen" },
  { value: "9:16", label: "9:16 - Mobile" },
  { value: "21:9", label: "21:9 - Ultrawide" },
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];

export type GenerationStatus =
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "IN_QUEUE"
  | "FAILED";

export const FileSchema = z.object({
  url: z.string(),
  content_type: z.string().nullable(),
  file_name: z.string().nullable(),
  file_size: z.number().nullable(),
});

export const ImageGenerationResponseSchema = z.object({
  images: z.array(FileSchema),
  description: z.string().nullable(),
});

export const MAX_REFERENCE_IMAGES = 4;
export const MAX_IMAGES = 4;
