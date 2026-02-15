import type { ContactMethod, ImportedAgent, RecruitmentStatus } from "@prisma/client";

export interface ContactStrategy {
  method: ContactMethod;
  url: string;
  priority: number;
  description: string;
}

export interface ContactResult {
  success: boolean;
  sent: boolean;
  status?: number;
  response?: unknown;
  error?: string;
  interested?: boolean;
  optOutSignal?: boolean;
  note?: string;
}

export interface RecruitmentResult {
  importedAgentId: string;
  targetName: string;
  targetUrl: string;
  status: RecruitmentStatus | "SKIPPED";
  method?: ContactMethod;
  contactUrl?: string;
  inviteUrl?: string;
  reason?: string;
  attemptNumber?: number;
}

export interface RecruitBatchResult {
  total: number;
  sent: number;
  delivered: number;
  interested: number;
  failed: number;
  skipped: number;
  optedOut: number;
  results: RecruitmentResult[];
}

export interface RecruitBatchOptions {
  source?: string;
  limit?: number;
  campaign?: string;
  dryRun?: boolean;
  contactMethods?: ContactMethod[];
  importedAgentIds?: string[];
}

export interface QualifiedRecruitmentCandidate {
  agent: ImportedAgent;
  score: number;
  strategies: ContactStrategy[];
  reasons: string[];
}
