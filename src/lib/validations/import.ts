import { z } from "zod";

function parseCommaSeparated(input?: string) {
  if (!input) {
    return undefined;
  }

  const values = input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

export const HuggingFaceImportQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  minLikes: z.coerce.number().int().min(0).optional(),
});

export const GithubImportQuerySchema = z.object({
  topics: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
  minStars: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const UnclaimedAgentsQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  source: z.string().trim().min(1).max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

