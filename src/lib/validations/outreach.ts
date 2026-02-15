import { OutreachStatus } from "@prisma/client";
import { z } from "zod";

import { OUTREACH_TEMPLATES } from "@/lib/constants/outreach-templates";

const TemplateSchema = z.enum(
  Object.keys(OUTREACH_TEMPLATES) as [keyof typeof OUTREACH_TEMPLATES, ...(keyof typeof OUTREACH_TEMPLATES)[]],
);

export const GenerateOutreachSchema = z.object({
  importedAgentIds: z.array(z.string().trim().min(2).max(120)).min(1).max(200),
  template: TemplateSchema,
  campaign: z.string().trim().min(2).max(120),
});

export const GenerateBulkOutreachSchema = z.object({
  source: z.string().trim().min(1).max(60).optional(),
  template: TemplateSchema,
  campaign: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const ListOutreachQuerySchema = z.object({
  platform: z.string().trim().min(1).max(60).optional(),
  status: z.nativeEnum(OutreachStatus).optional(),
  campaign: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateOutreachSchema = z.object({
  status: z.nativeEnum(OutreachStatus),
  notes: z.string().trim().max(500).optional(),
});

