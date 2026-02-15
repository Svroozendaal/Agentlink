import { ContactMethod, RecruitmentStatus } from "@prisma/client";
import { z } from "zod";

export const RecruitmentOptOutSchema = z.object({
  domain: z.string().trim().min(2).max(255),
  reason: z.string().trim().max(300).optional(),
});

export const RecruitmentOptOutCheckQuerySchema = z.object({
  domain: z.string().trim().min(2).max(255),
});

export const RecruitmentQualifySchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).optional(),
  minScore: z.coerce.number().int().min(-100).max(200).optional(),
});

export const RecruitmentPreviewSchema = z.object({
  agentIds: z.array(z.string().trim().min(1)).min(1).max(200),
  campaign: z.string().trim().min(1).max(80),
});

export const RecruitmentExecuteSchema = z.object({
  agentIds: z.array(z.string().trim().min(1)).min(1).max(200),
  campaign: z.string().trim().min(1).max(80),
});

export const RecruitmentPipelineSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  dryRun: z.boolean().optional().default(true),
  campaign: z.string().trim().min(1).max(80).default("auto"),
});

export const RecruitmentStatusQuerySchema = z.object({
  status: z.nativeEnum(RecruitmentStatus).optional(),
  method: z.nativeEnum(ContactMethod).optional(),
  campaign: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type RecruitmentPreviewInput = z.infer<typeof RecruitmentPreviewSchema>;
export type RecruitmentExecuteInput = z.infer<typeof RecruitmentExecuteSchema>;
export type RecruitmentPipelineInput = z.infer<typeof RecruitmentPipelineSchema>;
