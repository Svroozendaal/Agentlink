import {
  ContactMethod,
  ImportStatus,
  RecruitmentStatus,
  type ImportedAgent,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { createInvite } from "@/lib/services/invites";
import { AgentServiceError } from "@/lib/services/agents";
import { analyzeResponse } from "@/lib/recruitment/analyzer";
import { contactViaA2A } from "@/lib/recruitment/executors/executor-a2a";
import { contactViaEmailApi } from "@/lib/recruitment/executors/executor-email";
import { contactViaGithubIssue } from "@/lib/recruitment/executors/executor-github";
import { contactViaMcp } from "@/lib/recruitment/executors/executor-mcp";
import { contactViaRest } from "@/lib/recruitment/executors/executor-rest";
import { contactViaWebhook } from "@/lib/recruitment/executors/executor-webhook";
import { contactViaWellKnown } from "@/lib/recruitment/executors/executor-wellknown";
import { ensureRecruiterIdentity } from "@/lib/recruitment/identity";
import {
  buildA2AInvitation,
  buildGithubIssueInvitation,
  buildRestInvitation,
  buildWebhookInvitation,
} from "@/lib/recruitment/messages";
import { createRecruitmentOptOut, isDomainOptedOut } from "@/lib/recruitment/opt-out";
import { determineContactStrategy } from "@/lib/recruitment/strategy";
import type {
  ContactResult,
  RecruitBatchOptions,
  RecruitBatchResult,
  RecruitmentResult,
} from "@/lib/recruitment/types";
import { domainFromUrl, domainPolitenessKey, sleep } from "@/lib/recruitment/utils";

const RECENT_CONTACT_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;
const RETRY_DELAY_MS = 24 * 60 * 60 * 1_000;
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_BATCH_LIMIT = 50;

function parseIntEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function recruitmentEnabled() {
  return String(process.env.RECRUITMENT_ENABLED ?? "false").toLowerCase() === "true";
}

function defaultDryRun() {
  return String(process.env.RECRUITMENT_DRY_RUN ?? "true").toLowerCase() !== "false";
}

function isRecent(date: Date, windowMs: number) {
  return Date.now() - date.getTime() < windowMs;
}

async function assertGlobalRateLimits() {
  const maxPerHour = parseIntEnv("RECRUITMENT_MAX_PER_HOUR", 100);
  const maxPerDay = parseIntEnv("RECRUITMENT_MAX_PER_DAY", 500);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000);

  const [hourCount, dayCount] = await Promise.all([
    db.recruitmentAttempt.count({
      where: {
        createdAt: { gte: oneHourAgo },
        status: { not: RecruitmentStatus.PENDING },
      },
    }),
    db.recruitmentAttempt.count({
      where: {
        createdAt: { gte: oneDayAgo },
        status: { not: RecruitmentStatus.PENDING },
      },
    }),
  ]);

  if (hourCount >= maxPerHour) {
    throw new AgentServiceError(429, "RATE_LIMITED", "Hourly recruitment limit reached");
  }

  if (dayCount >= maxPerDay) {
    throw new AgentServiceError(429, "RATE_LIMITED", "Daily recruitment limit reached");
  }
}

async function assertDomainPoliteness(targetUrl: string) {
  const key = domainPolitenessKey(targetUrl);
  const since = new Date(Date.now() - RECENT_CONTACT_WINDOW_MS);

  const recentAttempts = await db.recruitmentAttempt.findMany({
    where: {
      createdAt: { gte: since },
      status: {
        in: [
          RecruitmentStatus.SENT,
          RecruitmentStatus.DELIVERED,
          RecruitmentStatus.INTERESTED,
          RecruitmentStatus.REGISTERED,
          RecruitmentStatus.DECLINED,
        ],
      },
    },
    select: {
      targetUrl: true,
      contactUrl: true,
    },
  });

  const domainCount = recentAttempts.filter((attempt) => {
    return (
      domainPolitenessKey(attempt.targetUrl) === key ||
      domainPolitenessKey(attempt.contactUrl) === key
    );
  }).length;

  if (domainCount >= 1) {
    throw new AgentServiceError(
      429,
      "RATE_LIMITED",
      "Per-domain recruitment limit reached (1 contact per 7 days)",
    );
  }
}

function shouldSkipExistingAttempt(
  existing: {
    status: RecruitmentStatus;
    attemptNumber: number;
    updatedAt: Date;
    nextRetryAt: Date | null;
  } | null,
) {
  if (!existing) {
    return { skip: false as const };
  }

  if (
    existing.status === RecruitmentStatus.DECLINED ||
    existing.status === RecruitmentStatus.OPTED_OUT ||
    existing.status === RecruitmentStatus.REGISTERED ||
    existing.status === RecruitmentStatus.INTERESTED
  ) {
    return {
      skip: true as const,
      reason: "Target already completed a terminal recruitment outcome",
    };
  }

  if (
    (existing.status === RecruitmentStatus.SENT || existing.status === RecruitmentStatus.DELIVERED) &&
    isRecent(existing.updatedAt, RECENT_CONTACT_WINDOW_MS)
  ) {
    return {
      skip: true as const,
      reason: "Target was contacted recently",
    };
  }

  if (existing.status === RecruitmentStatus.FAILED && existing.attemptNumber >= MAX_RETRY_ATTEMPTS) {
    return {
      skip: true as const,
      reason: "Maximum retry attempts reached",
    };
  }

  if (existing.nextRetryAt && existing.nextRetryAt.getTime() > Date.now()) {
    return {
      skip: true as const,
      reason: "Retry is scheduled for later",
    };
  }

  return { skip: false as const };
}

function getContactStatus(result: ContactResult) {
  if (!result.success) {
    return RecruitmentStatus.FAILED;
  }

  const analysis = analyzeResponse(result.response, result.status ?? null);
  if (analysis.intent !== "UNKNOWN") {
    return analysis.intent;
  }

  if (result.status && result.status >= 200 && result.status < 300) {
    return RecruitmentStatus.DELIVERED;
  }

  return RecruitmentStatus.SENT;
}

async function upsertRecruitmentAttempt(input: {
  importedAgent: ImportedAgent;
  targetUrl: string;
  contactUrl: string;
  contactMethod: ContactMethod;
  requestPayload: Prisma.InputJsonValue;
  result: ContactResult;
  campaign: string;
  inviteToken?: string;
}) {
  const existing = await db.recruitmentAttempt.findUnique({
    where: {
      targetUrl_contactMethod: {
        targetUrl: input.targetUrl,
        contactMethod: input.contactMethod,
      },
    },
    select: {
      id: true,
      attemptNumber: true,
    },
  });

  const nextAttemptNumber = existing ? existing.attemptNumber + 1 : 1;
  const status = getContactStatus(input.result);
  const nextRetryAt =
    status === RecruitmentStatus.FAILED && nextAttemptNumber < MAX_RETRY_ATTEMPTS
      ? new Date(Date.now() + RETRY_DELAY_MS)
      : null;

  const data: Prisma.RecruitmentAttemptUncheckedCreateInput = {
    importedAgentId: input.importedAgent.id,
    targetName: input.importedAgent.name,
    targetUrl: input.targetUrl,
    contactUrl: input.contactUrl,
    contactMethod: input.contactMethod,
    requestPayload: input.requestPayload,
    responsePayload: input.result.response as Prisma.InputJsonValue | undefined,
    responseStatus: input.result.status,
    status,
    errorMessage: input.result.error ?? input.result.note,
    inviteToken: input.inviteToken,
    campaign: input.campaign,
    attemptNumber: nextAttemptNumber,
    nextRetryAt,
  };

  if (existing) {
    return db.recruitmentAttempt.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.recruitmentAttempt.create({
    data,
  });
}

async function executeStrategy(input: {
  method: ContactMethod;
  strategyUrl: string;
  importedAgent: ImportedAgent;
  inviteToken: string;
  campaign: string;
}) {
  if (input.method === ContactMethod.REST_ENDPOINT) {
    const payload = buildRestInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload,
      result: await contactViaRest(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.A2A_PROTOCOL) {
    const payload = buildA2AInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload,
      result: await contactViaA2A(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.MCP_INTERACTION) {
    const payload = buildRestInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload,
      result: await contactViaMcp(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.WELL_KNOWN_CHECK) {
    const payload = buildRestInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload,
      result: await contactViaWellKnown(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.GITHUB_ISSUE) {
    const payload = buildGithubIssueInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload as unknown as Prisma.InputJsonValue,
      result: await contactViaGithubIssue(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.GITHUB_PR) {
    return {
      requestPayload: { note: "PR executor not implemented" } as Prisma.InputJsonValue,
      result: {
        success: false,
        sent: false,
        error: "GITHUB_PR executor is not implemented",
      } satisfies ContactResult,
      contactUrl: input.strategyUrl,
    };
  }

  if (input.method === ContactMethod.WEBHOOK_PING) {
    const payload = buildWebhookInvitation({
      agent: input.importedAgent,
      inviteToken: input.inviteToken,
      campaign: input.campaign,
    });

    return {
      requestPayload: payload,
      result: await contactViaWebhook(input.strategyUrl, payload),
      contactUrl: input.strategyUrl,
    };
  }

  const payload = buildRestInvitation({
    agent: input.importedAgent,
    inviteToken: input.inviteToken,
    campaign: input.campaign,
  });

  return {
    requestPayload: payload,
    result: await contactViaEmailApi(domainFromUrl(input.strategyUrl), payload),
    contactUrl: input.strategyUrl,
  };
}

export async function recruitAgent(
  importedAgentId: string,
  options?: {
    campaign?: string;
    dryRun?: boolean;
    contactMethods?: ContactMethod[];
  },
): Promise<RecruitmentResult> {
  const importedAgent = await db.importedAgent.findUnique({
    where: { id: importedAgentId },
  });

  if (!importedAgent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Imported agent not found");
  }

  if (importedAgent.status !== ImportStatus.UNCLAIMED) {
    return {
      importedAgentId,
      targetName: importedAgent.name,
      targetUrl: importedAgent.sourceUrl,
      status: "SKIPPED",
      reason: "Imported agent is no longer unclaimed",
    };
  }

  const campaign = options?.campaign ?? "auto";
  const dryRun = options?.dryRun ?? defaultDryRun();
  const optedOut = await isDomainOptedOut(importedAgent.sourceUrl);

  if (optedOut) {
    return {
      importedAgentId,
      targetName: importedAgent.name,
      targetUrl: importedAgent.sourceUrl,
      status: RecruitmentStatus.OPTED_OUT,
      reason: "Domain opted out from recruitment",
    };
  }

  const strategies = determineContactStrategy(importedAgent).filter((strategy) =>
    options?.contactMethods ? options.contactMethods.includes(strategy.method) : true,
  );

  if (strategies.length === 0) {
    return {
      importedAgentId,
      targetName: importedAgent.name,
      targetUrl: importedAgent.sourceUrl,
      status: "SKIPPED",
      reason: "No compatible contact strategy was found",
    };
  }

  if (!dryRun && !recruitmentEnabled()) {
    return {
      importedAgentId,
      targetName: importedAgent.name,
      targetUrl: importedAgent.sourceUrl,
      status: "SKIPPED",
      reason: "Recruitment is disabled (RECRUITMENT_ENABLED=false)",
    };
  }

  const recruiter = await ensureRecruiterIdentity();

  if (!dryRun) {
    await assertGlobalRateLimits();
    await assertDomainPoliteness(importedAgent.sourceUrl);
  }

  for (const strategy of strategies) {
    const existing = await db.recruitmentAttempt.findUnique({
      where: {
        targetUrl_contactMethod: {
          targetUrl: importedAgent.sourceUrl,
          contactMethod: strategy.method,
        },
      },
      select: {
        status: true,
        attemptNumber: true,
        updatedAt: true,
        nextRetryAt: true,
      },
    });

    const skip = shouldSkipExistingAttempt(existing);
    if (skip.skip) {
      continue;
    }

    const invite = await createInvite({
      campaign,
      agentName: importedAgent.name,
      agentData: {
        name: importedAgent.name,
        description: importedAgent.description,
        skills: importedAgent.skills,
        endpointUrl: importedAgent.endpointUrl,
        websiteUrl: importedAgent.websiteUrl,
        sourceUrl: importedAgent.sourceUrl,
      },
      adminUserId: recruiter.userId,
    });

    if (dryRun) {
      return {
        importedAgentId,
        targetName: importedAgent.name,
        targetUrl: importedAgent.sourceUrl,
        status: "SKIPPED",
        method: strategy.method,
        contactUrl: strategy.url,
        inviteUrl: invite.url,
        reason: "Dry-run mode; no invitation sent",
      };
    }

    const execution = await executeStrategy({
      method: strategy.method,
      strategyUrl: strategy.url,
      importedAgent,
      inviteToken: invite.token,
      campaign,
    });

    const attempt = await upsertRecruitmentAttempt({
      importedAgent,
      targetUrl: importedAgent.sourceUrl,
      contactUrl: execution.contactUrl,
      contactMethod: strategy.method,
      requestPayload: execution.requestPayload as Prisma.InputJsonValue,
      result: execution.result,
      campaign,
      inviteToken: invite.token,
    });

    if (attempt.status === RecruitmentStatus.OPTED_OUT) {
      await createRecruitmentOptOut({
        domain: importedAgent.sourceUrl,
        reason: execution.result.error ?? "Opt-out signal detected from response",
      });
    }

    if (execution.result.success && execution.result.sent) {
      return {
        importedAgentId,
        targetName: importedAgent.name,
        targetUrl: importedAgent.sourceUrl,
        status: attempt.status,
        method: strategy.method,
        contactUrl: execution.contactUrl,
        inviteUrl: invite.url,
        attemptNumber: attempt.attemptNumber,
      };
    }
  }

  return {
    importedAgentId,
    targetName: importedAgent.name,
    targetUrl: importedAgent.sourceUrl,
    status: RecruitmentStatus.FAILED,
    reason: "All recruitment strategies failed",
  };
}

export async function recruitBatch(options?: RecruitBatchOptions): Promise<RecruitBatchResult> {
  const limit = Math.max(1, Math.min(options?.limit ?? DEFAULT_BATCH_LIMIT, 200));
  const campaign = options?.campaign ?? "auto";
  const dryRun = options?.dryRun ?? defaultDryRun();

  const where: Prisma.ImportedAgentWhereInput = {
    status: ImportStatus.UNCLAIMED,
    ...(options?.source ? { sourcePlatform: options.source } : {}),
    ...(options?.importedAgentIds?.length
      ? {
          id: {
            in: options.importedAgentIds,
          },
        }
      : {}),
  };

  const importedAgents = await db.importedAgent.findMany({
    where,
    orderBy: { importedAt: "desc" },
    take: limit,
  });

  const results: RecruitmentResult[] = [];
  let sent = 0;
  let delivered = 0;
  let interested = 0;
  let failed = 0;
  let skipped = 0;
  let optedOut = 0;

  for (const importedAgent of importedAgents) {
    const result = await recruitAgent(importedAgent.id, {
      campaign,
      dryRun,
      contactMethods: options?.contactMethods,
    });

    results.push(result);

    if (result.status === "SKIPPED") {
      skipped += 1;
    } else if (result.status === RecruitmentStatus.FAILED) {
      failed += 1;
    } else if (result.status === RecruitmentStatus.OPTED_OUT) {
      optedOut += 1;
    } else {
      sent += 1;
      if (result.status === RecruitmentStatus.DELIVERED || result.status === RecruitmentStatus.REGISTERED) {
        delivered += 1;
      }
      if (result.status === RecruitmentStatus.INTERESTED || result.status === RecruitmentStatus.REGISTERED) {
        interested += 1;
      }
    }

    if (!dryRun) {
      await sleep(2_000);
    }
  }

  return {
    total: importedAgents.length,
    sent,
    delivered,
    interested,
    failed,
    skipped,
    optedOut,
    results,
  };
}

export async function getRecruitmentStatus() {
  const [totalAttempts, byStatus, byMethod, byCampaign, recentResults, attemptsWithSource, optOutCount] =
    await Promise.all([
    db.recruitmentAttempt.count(),
    db.recruitmentAttempt.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.recruitmentAttempt.groupBy({
      by: ["contactMethod"],
      _count: { _all: true },
    }),
    db.recruitmentAttempt.groupBy({
      by: ["campaign"],
      _count: { _all: true },
      orderBy: { campaign: "asc" },
    }),
    db.recruitmentAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        targetName: true,
        targetUrl: true,
        contactMethod: true,
        status: true,
        responseStatus: true,
        attemptNumber: true,
        campaign: true,
        createdAt: true,
        errorMessage: true,
      },
    }),
    db.recruitmentAttempt.findMany({
      select: {
        importedAgent: {
          select: {
            sourcePlatform: true,
          },
        },
      },
    }),
    db.recruitmentOptOut.count(),
    ]);

  const bySourceMap = new Map<string, number>();
  for (const attempt of attemptsWithSource) {
    const source = attempt.importedAgent?.sourcePlatform ?? "unknown";
    bySourceMap.set(source, (bySourceMap.get(source) ?? 0) + 1);
  }

  const statusCount = new Map(byStatus.map((entry) => [entry.status, entry._count._all]));
  const funnel = {
    contacted: totalAttempts,
    delivered:
      (statusCount.get(RecruitmentStatus.DELIVERED) ?? 0) +
      (statusCount.get(RecruitmentStatus.INTERESTED) ?? 0) +
      (statusCount.get(RecruitmentStatus.REGISTERED) ?? 0),
    interested:
      (statusCount.get(RecruitmentStatus.INTERESTED) ?? 0) +
      (statusCount.get(RecruitmentStatus.REGISTERED) ?? 0),
    registered: statusCount.get(RecruitmentStatus.REGISTERED) ?? 0,
  };

  return {
    totalAttempts,
    byStatus: byStatus.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    byMethod: byMethod.map((entry) => ({
      method: entry.contactMethod,
      count: entry._count._all,
    })),
    byCampaign: byCampaign.map((entry) => ({
      campaign: entry.campaign,
      count: entry._count._all,
    })),
    bySource: Array.from(bySourceMap.entries()).map(([source, count]) => ({ source, count })),
    funnel,
    recentResults,
    optOutCount,
  };
}
