import { ContactMethod, ImportStatus, RecruitmentStatus, type ImportedAgent } from "@prisma/client";

import { db } from "@/lib/db";
import { importFromGithub, importFromHuggingFace } from "@/lib/services/import";
import { createInvite } from "@/lib/services/invites";
import { ensureRecruiterIdentity } from "@/lib/recruitment/identity";
import {
  buildA2AInvitation,
  buildGithubIssueInvitation,
  buildPreviewText,
  buildRestInvitation,
  buildWebhookInvitation,
} from "@/lib/recruitment/messages";
import { isDomainOptedOut } from "@/lib/recruitment/opt-out";
import { recruitBatch } from "@/lib/recruitment/orchestrator";
import { determineContactStrategy } from "@/lib/recruitment/strategy";
import type { QualifiedRecruitmentCandidate } from "@/lib/recruitment/types";
import { toObject } from "@/lib/recruitment/utils";

const RECENT_WINDOW_DAYS = 7;

export interface RecruitmentPipelineOptions {
  limit?: number;
  dryRun?: boolean;
  campaign?: string;
}

export interface RecruitmentPipelineResult {
  discovered: number;
  qualified: number;
  prepared: number;
  sent: number;
  delivered: number;
  failed: number;
  newOptOuts: number;
  byMethod: Record<string, { sent: number; delivered: number }>;
  preview: RecruitmentPreviewMessage[];
}

export interface RecruitmentPreviewMessage {
  importedAgentId: string;
  agentName: string;
  source: string;
  method: ContactMethod;
  contactUrl: string;
  subject: string;
  body: string;
  inviteUrl: string;
  inviteToken: string;
}

function readSourceDataDate(agent: ImportedAgent) {
  const sourceData = toObject(agent.sourceData);
  const raw = sourceData?.updated_at ?? sourceData?.updatedAt;
  if (typeof raw !== "string") {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readGithubStars(agent: ImportedAgent) {
  const sourceData = toObject(agent.sourceData);
  const stars = sourceData?.stargazers_count ?? sourceData?.stars;
  if (typeof stars === "number") {
    return stars;
  }

  return 0;
}

function readDocumentationUrl(agent: ImportedAgent) {
  const sourceData = toObject(agent.sourceData);
  const value = sourceData?.documentationUrl ?? sourceData?.documentation_url;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function scoreImportedAgent(agent: ImportedAgent) {
  let score = 0;
  const reasons: string[] = [];

  const stars = readGithubStars(agent);
  if (stars > 50) {
    score += 10;
    reasons.push("GitHub stars > 50 (+10)");
  }

  if (agent.endpointUrl) {
    score += 5;
    reasons.push("Has endpoint URL (+5)");
  }

  if (readDocumentationUrl(agent)) {
    score += 3;
    reasons.push("Has documentation URL (+3)");
  }

  if ((agent.description ?? "").length > 100) {
    score += 2;
    reasons.push("Description length > 100 (+2)");
  }

  const updatedAt = readSourceDataDate(agent);
  const recentThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1_000);
  if (updatedAt && updatedAt > recentThreshold) {
    score += 5;
    reasons.push("Updated in last 3 months (+5)");
  }

  if (!agent.description || agent.description.trim().length < 10) {
    score -= 10;
    reasons.push("Low-quality description (-10)");
  }

  if (agent.skills.length === 0) {
    score -= 10;
    reasons.push("No identifiable skills (-10)");
  }

  return { score, reasons };
}

function canBeContacted(agent: ImportedAgent) {
  if (agent.endpointUrl) {
    return true;
  }

  if (agent.sourcePlatform === "github") {
    return true;
  }

  return false;
}

async function contactedRecently(agent: ImportedAgent) {
  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1_000);

  const existing = await db.recruitmentAttempt.findFirst({
    where: {
      targetUrl: agent.sourceUrl,
      createdAt: { gte: since },
      status: {
        in: [
          RecruitmentStatus.SENT,
          RecruitmentStatus.DELIVERED,
          RecruitmentStatus.INTERESTED,
          RecruitmentStatus.REGISTERED,
          RecruitmentStatus.DECLINED,
          RecruitmentStatus.OPTED_OUT,
        ],
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function runRecruitmentDiscover() {
  const [huggingface, github] = await Promise.all([
    importFromHuggingFace({ limit: 100, minLikes: 2 }),
    importFromGithub({ limit: 60, minStars: 5 }),
  ]);

  return {
    newAgents: huggingface.imported + github.imported,
    sources: {
      huggingface,
      github,
    },
  };
}

export async function qualifyImportedAgents(options?: {
  limit?: number;
  minScore?: number;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 300));
  const minScore = options?.minScore ?? 1;

  const imported = await db.importedAgent.findMany({
    where: {
      status: ImportStatus.UNCLAIMED,
    },
    orderBy: { importedAt: "desc" },
    take: Math.max(limit * 4, 100),
  });

  const qualified: QualifiedRecruitmentCandidate[] = [];

  for (const agent of imported) {
    if (!canBeContacted(agent)) {
      continue;
    }

    if (await isDomainOptedOut(agent.sourceUrl)) {
      continue;
    }

    if (await contactedRecently(agent)) {
      continue;
    }

    const strategies = determineContactStrategy(agent);
    if (strategies.length === 0) {
      continue;
    }

    const { score, reasons } = scoreImportedAgent(agent);
    if (score < minScore) {
      continue;
    }

    qualified.push({
      agent,
      score,
      reasons,
      strategies,
    });
  }

  qualified.sort((a, b) => b.score - a.score || b.agent.importedAt.getTime() - a.agent.importedAt.getTime());

  return {
    qualified: qualified.slice(0, limit),
  };
}

function buildPreviewBody(method: ContactMethod, payload: unknown) {
  if (method === ContactMethod.GITHUB_ISSUE) {
    const parsed = payload as { body: string };
    return parsed.body;
  }

  return buildPreviewText(method, payload);
}

function buildPreviewSubject(method: ContactMethod, payload: unknown) {
  if (method === ContactMethod.GITHUB_ISSUE) {
    const parsed = payload as { title: string };
    return parsed.title;
  }

  return `AgentLink invitation via ${method}`;
}

export async function previewRecruitmentMessages(input: {
  agentIds: string[];
  campaign: string;
  adminUserId: string;
}) {
  const importedAgents = await db.importedAgent.findMany({
    where: {
      id: { in: input.agentIds },
      status: ImportStatus.UNCLAIMED,
    },
  });

  const messages: RecruitmentPreviewMessage[] = [];

  for (const agent of importedAgents) {
    const strategy = determineContactStrategy(agent)[0];
    if (!strategy) {
      continue;
    }

    const invite = await createInvite({
      campaign: input.campaign,
      agentName: agent.name,
      agentData: {
        name: agent.name,
        description: agent.description,
        skills: agent.skills,
        sourceUrl: agent.sourceUrl,
        endpointUrl: agent.endpointUrl,
      },
      adminUserId: input.adminUserId,
    });

    let payload: unknown;

    if (strategy.method === ContactMethod.A2A_PROTOCOL) {
      payload = buildA2AInvitation({
        agent,
        inviteToken: invite.token,
        campaign: input.campaign,
      });
    } else if (strategy.method === ContactMethod.GITHUB_ISSUE) {
      payload = buildGithubIssueInvitation({
        agent,
        inviteToken: invite.token,
        campaign: input.campaign,
      });
    } else if (strategy.method === ContactMethod.WEBHOOK_PING) {
      payload = buildWebhookInvitation({
        agent,
        inviteToken: invite.token,
        campaign: input.campaign,
      });
    } else {
      payload = buildRestInvitation({
        agent,
        inviteToken: invite.token,
        campaign: input.campaign,
      });
    }

    messages.push({
      importedAgentId: agent.id,
      agentName: agent.name,
      source: agent.sourcePlatform,
      method: strategy.method,
      contactUrl: strategy.url,
      subject: buildPreviewSubject(strategy.method, payload),
      body: buildPreviewBody(strategy.method, payload),
      inviteUrl: invite.url,
      inviteToken: invite.token,
    });
  }

  return {
    messages,
  };
}

export async function executeRecruitmentMessages(input: {
  agentIds: string[];
  campaign: string;
}) {
  const result = await recruitBatch({
    importedAgentIds: input.agentIds,
    campaign: input.campaign,
    dryRun: false,
    limit: input.agentIds.length,
  });

  return {
    results: result.results,
    summary: {
      total: result.total,
      sent: result.sent,
      delivered: result.delivered,
      failed: result.failed,
      skipped: result.skipped,
      optedOut: result.optedOut,
    },
  };
}

export async function runRecruitmentPipeline(
  options?: RecruitmentPipelineOptions,
): Promise<RecruitmentPipelineResult> {
  const campaign = options?.campaign ?? "auto";
  const dryRun = options?.dryRun ?? true;
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  const recruiter = await ensureRecruiterIdentity();

  const beforeOptOutCount = await db.recruitmentOptOut.count();
  const discovery = await runRecruitmentDiscover();
  const qualified = await qualifyImportedAgents({
    limit,
    minScore: 1,
  });

  const preview = await previewRecruitmentMessages({
    agentIds: qualified.qualified.map((entry) => entry.agent.id),
    campaign,
    adminUserId: recruiter.userId,
  });

  if (dryRun) {
    const afterOptOutCount = await db.recruitmentOptOut.count();
    return {
      discovered: discovery.newAgents,
      qualified: qualified.qualified.length,
      prepared: preview.messages.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      newOptOuts: Math.max(0, afterOptOutCount - beforeOptOutCount),
      byMethod: {},
      preview: preview.messages,
    };
  }

  const execution = await executeRecruitmentMessages({
    agentIds: preview.messages.map((message) => message.importedAgentId),
    campaign,
  });

  const byMethod: Record<string, { sent: number; delivered: number }> = {};
  for (const result of execution.results) {
    if (!result.method) {
      continue;
    }

    if (!byMethod[result.method]) {
      byMethod[result.method] = { sent: 0, delivered: 0 };
    }

    if (result.status !== "SKIPPED") {
      byMethod[result.method].sent += 1;
    }

    if (
      result.status === RecruitmentStatus.DELIVERED ||
      result.status === RecruitmentStatus.INTERESTED ||
      result.status === RecruitmentStatus.REGISTERED
    ) {
      byMethod[result.method].delivered += 1;
    }
  }

  const afterOptOutCount = await db.recruitmentOptOut.count();

  return {
    discovered: discovery.newAgents,
    qualified: qualified.qualified.length,
    prepared: preview.messages.length,
    sent: execution.summary.sent,
    delivered: execution.summary.delivered,
    failed: execution.summary.failed,
    newOptOuts: Math.max(0, afterOptOutCount - beforeOptOutCount),
    byMethod,
    preview: preview.messages,
  };
}
