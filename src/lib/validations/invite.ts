import { z } from "zod";

const AgentDataSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(5).max(500).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  websiteUrl: z.string().url().optional(),
});

export const CreateInviteSchema = z.object({
  campaign: z.string().trim().min(2).max(120),
  agentName: z.string().trim().min(2).max(120).optional(),
  agentData: AgentDataSchema.optional(),
  maxUses: z.coerce.number().int().min(1).max(1000).optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
});

export const CreateBulkInvitesSchema = z.object({
  campaign: z.string().trim().min(2).max(120),
  agents: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().max(500).optional(),
        skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
        url: z.string().url().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export const ListInvitesQuerySchema = z.object({
  campaign: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["active", "used", "expired"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

