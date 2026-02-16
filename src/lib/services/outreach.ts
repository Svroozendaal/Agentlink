import {
  ContactMethod,
  OutreachStatus,
  type ImportedAgent,
  type OutreachRecord,
  type InviteToken,
} from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { OUTREACH_TEMPLATES, type OutreachTemplateKey } from "@/lib/constants/outreach-templates";
import { isDomainOptedOut } from "@/lib/recruitment/opt-out";
import { determineContactStrategy } from "@/lib/recruitment/strategy";
import type { ContactResult } from "@/lib/recruitment/types";
import { parseGithubRepo } from "@/lib/recruitment/utils";
import { contactViaA2A } from "@/lib/recruitment/executors/executor-a2a";
import { contactViaEmailApi } from "@/lib/recruitment/executors/executor-email";
import { contactViaGithubIssue } from "@/lib/recruitment/executors/executor-github";
import { contactViaMcp } from "@/lib/recruitment/executors/executor-mcp";
import { contactViaRest } from "@/lib/recruitment/executors/executor-rest";
import { contactViaWebhook } from "@/lib/recruitment/executors/executor-webhook";
import { contactViaWellKnown } from "@/lib/recruitment/executors/executor-wellknown";
import { createInvite } from "@/lib/services/invites";

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => variables[key] ?? `{${key}}`);
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

function toHtmlText(body: string) {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function parseIntEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeTemplateKey(value: string): OutreachTemplateKey {
  if (value in OUTREACH_TEMPLATES) {
    return value as OutreachTemplateKey;
  }

  return "generic_developer";
}

function appendNote(existing: string | null, next: string) {
  const trimmedNext = next.trim();
  if (!trimmedNext) {
    return existing ?? null;
  }

  if (!existing || existing.trim().length === 0) {
    return trimmedNext;
  }

  return `${existing.trim()}\n${trimmedNext}`;
}

export async function generateOutreachMessage(input: {
  templateKey: OutreachTemplateKey;
  variables: Record<string, string>;
  adminUserId: string;
  campaign: string;
}) {
  const template = OUTREACH_TEMPLATES[input.templateKey];
  if (!template) {
    throw new AgentServiceError(400, "VALIDATION_ERROR", "Unknown outreach template");
  }

  const inviteUrl = input.variables.inviteUrl
    ? input.variables.inviteUrl
    : (
        await createInvite({
          campaign: input.campaign,
          agentName: input.variables.agentName,
          adminUserId: input.adminUserId,
        })
      ).url;

  const renderedVariables = {
    ...input.variables,
    inviteUrl,
  };

  return {
    subject: renderTemplate(template.subject, renderedVariables),
    body: renderTemplate(template.body, renderedVariables),
    inviteUrl,
  };
}

export async function createOutreachRecord(input: {
  targetUrl: string;
  targetName: string;
  platform: string;
  templateKey: OutreachTemplateKey;
  adminUserId: string;
  campaign: string;
  email?: string;
  notes?: string;
  agentName?: string;
}) {
  const existing = await db.outreachRecord.findUnique({
    where: { targetUrl: input.targetUrl },
    select: { id: true },
  });

  if (existing) {
    throw new AgentServiceError(409, "DUPLICATE_OUTREACH", "Outreach already exists for this target");
  }

  const invite = await createInvite({
    campaign: input.campaign,
    agentName: input.agentName,
    adminUserId: input.adminUserId,
  });

  const message = await generateOutreachMessage({
    templateKey: input.templateKey,
    adminUserId: input.adminUserId,
    campaign: input.campaign,
    variables: {
      agentName: input.agentName ?? input.targetName,
      developerName: input.targetName,
      senderName: "AgentLink Team",
      inviteUrl: invite.url,
    },
  });

  const inviteToken = await db.inviteToken.findUnique({
    where: { token: invite.token },
    select: { id: true },
  });

  const record = await db.outreachRecord.create({
    data: {
      targetName: input.targetName,
      targetEmail: input.email,
      targetUrl: input.targetUrl,
      platform: input.platform,
      campaign: input.campaign,
      messageTemplate: input.templateKey,
      notes: input.notes,
      inviteTokenId: inviteToken?.id,
      status: OutreachStatus.QUEUED,
    },
  });

  return {
    outreachId: record.id,
    message,
  };
}

export async function markOutreachSent(outreachId: string) {
  return db.outreachRecord.update({
    where: { id: outreachId },
    data: {
      status: OutreachStatus.SENT,
      sentAt: new Date(),
    },
  });
}

interface OutreachRecordWithInviteToken extends OutreachRecord {
  inviteToken: Pick<InviteToken, "token"> | null;
}

interface OutreachPreparedMessage {
  subject: string;
  body: string;
  inviteUrl: string;
}

function prepareOutreachMessage(record: OutreachRecordWithInviteToken): OutreachPreparedMessage {
  const templateKey = normalizeTemplateKey(record.messageTemplate);
  const template = OUTREACH_TEMPLATES[templateKey];
  const inviteUrl = record.inviteToken?.token ? `${baseUrl()}/join/${record.inviteToken.token}` : baseUrl();

  const variables = {
    agentName: record.targetName,
    developerName: record.targetName,
    senderName: "AgentLink Team",
    inviteUrl,
  };

  return {
    subject: renderTemplate(template.subject, variables),
    body: renderTemplate(template.body, variables),
    inviteUrl,
  };
}

async function executeContactMethod(input: {
  method: ContactMethod;
  targetUrl: string;
  targetEmail: string | null;
  message: OutreachPreparedMessage;
  campaign: string | null;
}) {
  if (input.method === ContactMethod.EMAIL_API) {
    if (!input.targetEmail) {
      return {
        success: false,
        sent: false,
        error: "No target email available",
      } satisfies ContactResult;
    }

    return contactViaEmailApi(input.targetEmail, {
      to: input.targetEmail,
      subject: input.message.subject,
      text: input.message.body,
      html: `<p>${toHtmlText(input.message.body)}</p>`,
    });
  }

  if (input.method === ContactMethod.GITHUB_ISSUE) {
    return contactViaGithubIssue(input.targetUrl, {
      title: input.message.subject,
      body: input.message.body,
    });
  }

  const protocolPayload = {
    type: "agentlink_outreach_invitation",
    version: "1.0",
    campaign: input.campaign ?? "manual-outreach",
    subject: input.message.subject,
    message: input.message.body,
    invitation: {
      register_url: input.message.inviteUrl,
    },
    from: {
      name: "AgentLink Team",
      platform: "AgentLink",
      url: baseUrl(),
    },
  };

  if (input.method === ContactMethod.REST_ENDPOINT) {
    return contactViaRest(input.targetUrl, protocolPayload);
  }

  if (input.method === ContactMethod.A2A_PROTOCOL) {
    return contactViaA2A(input.targetUrl, {
      jsonrpc: "2.0",
      method: "agent/discover",
      params: {
        intent: "invitation",
        message: input.message.body,
        register_url: input.message.inviteUrl,
      },
    });
  }

  if (input.method === ContactMethod.MCP_INTERACTION) {
    return contactViaMcp(input.targetUrl, protocolPayload);
  }

  if (input.method === ContactMethod.WELL_KNOWN_CHECK) {
    return contactViaWellKnown(input.targetUrl, protocolPayload);
  }

  if (input.method === ContactMethod.WEBHOOK_PING) {
    return contactViaWebhook(input.targetUrl, protocolPayload);
  }

  return {
    success: false,
    sent: false,
    error: `Unsupported method: ${input.method}`,
  } satisfies ContactResult;
}

function buildCandidateMethods(record: OutreachRecordWithInviteToken, importedAgent: ImportedAgent | null) {
  const methods: Array<{ method: ContactMethod; targetUrl: string }> = [];
  const dedupe = new Set<string>();

  const addMethod = (method: ContactMethod, targetUrl: string) => {
    const key = `${method}:${targetUrl.toLowerCase()}`;
    if (!dedupe.has(key)) {
      dedupe.add(key);
      methods.push({ method, targetUrl });
    }
  };

  if (record.targetEmail) {
    addMethod(ContactMethod.EMAIL_API, record.targetEmail);
  }

  if (importedAgent) {
    const strategies = determineContactStrategy(importedAgent);
    for (const strategy of strategies) {
      addMethod(strategy.method, strategy.url);
    }
  }

  if (parseGithubRepo(record.targetUrl)) {
    addMethod(ContactMethod.GITHUB_ISSUE, record.targetUrl);
  }

  return methods;
}

export interface OutreachExecutionItem {
  outreachId: string;
  targetName: string;
  targetUrl: string;
  status: "SENT" | "FAILED" | "SKIPPED" | "OPTED_OUT";
  method?: ContactMethod;
  reason?: string;
}

export interface OutreachExecutionSummary {
  total: number;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  optedOut: number;
  byMethod: Partial<Record<ContactMethod, number>>;
  results: OutreachExecutionItem[];
}

export async function executeQueuedOutreach(input?: {
  campaign?: string;
  platform?: string;
  limit?: number;
  dryRun?: boolean;
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 50, 500));
  const dryRun = input?.dryRun ?? false;
  const where = {
    status: OutreachStatus.QUEUED,
    ...(input?.campaign ? { campaign: input.campaign } : {}),
    ...(input?.platform ? { platform: input.platform } : {}),
  };

  const records = await db.outreachRecord.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      inviteToken: {
        select: {
          token: true,
        },
      },
    },
  });

  const importedAgents = await db.importedAgent.findMany({
    where: {
      sourceUrl: {
        in: records.map((record) => record.targetUrl),
      },
    },
  });
  const importedAgentBySourceUrl = new Map(importedAgents.map((agent) => [agent.sourceUrl, agent]));

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [emailSentToday, githubSentToday] = await Promise.all([
    db.outreachRecord.count({
      where: {
        targetEmail: { not: null },
        sentAt: { gte: startOfDay },
        status: {
          in: [OutreachStatus.SENT, OutreachStatus.RESPONDED, OutreachStatus.REGISTERED],
        },
      },
    }),
    db.outreachRecord.count({
      where: {
        platform: "github",
        sentAt: { gte: startOfDay },
        status: {
          in: [OutreachStatus.SENT, OutreachStatus.RESPONDED, OutreachStatus.REGISTERED],
        },
      },
    }),
  ]);

  let emailRemaining = Math.max(0, parseIntEnv("OUTREACH_MAX_EMAILS_PER_DAY", 50) - emailSentToday);
  let githubRemaining = Math.max(0, parseIntEnv("OUTREACH_MAX_GITHUB_ISSUES_PER_DAY", 20) - githubSentToday);

  const results: OutreachExecutionItem[] = [];
  const byMethod: Partial<Record<ContactMethod, number>> = {};
  let attempted = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let optedOut = 0;

  for (const record of records) {
    const optedOutForTarget = await isDomainOptedOut(record.targetUrl);
    if (optedOutForTarget) {
      optedOut += 1;
      results.push({
        outreachId: record.id,
        targetName: record.targetName,
        targetUrl: record.targetUrl,
        status: "OPTED_OUT",
        reason: "Domain opted out from outreach",
      });

      if (!dryRun) {
        await db.outreachRecord.update({
          where: { id: record.id },
          data: {
            status: OutreachStatus.DECLINED,
            notes: appendNote(record.notes, `[${new Date().toISOString()}] Skipped: domain opted out.`),
          },
        });
      }
      continue;
    }

    const message = prepareOutreachMessage(record);
    const importedAgent = importedAgentBySourceUrl.get(record.targetUrl) ?? null;
    const candidateMethods = buildCandidateMethods(record, importedAgent);

    if (candidateMethods.length === 0) {
      skipped += 1;
      const reason = "No supported delivery channel found";
      results.push({
        outreachId: record.id,
        targetName: record.targetName,
        targetUrl: record.targetUrl,
        status: "SKIPPED",
        reason,
      });

      if (!dryRun) {
        await db.outreachRecord.update({
          where: { id: record.id },
          data: {
            notes: appendNote(record.notes, `[${new Date().toISOString()}] ${reason}.`),
          },
        });
      }
      continue;
    }

    attempted += 1;
    let delivered = false;
    let lastReason = "All delivery methods failed";

    for (const candidate of candidateMethods) {
      if (candidate.method === ContactMethod.EMAIL_API && emailRemaining <= 0) {
        lastReason = "Daily email outreach limit reached";
        continue;
      }

      if (candidate.method === ContactMethod.GITHUB_ISSUE && githubRemaining <= 0) {
        lastReason = "Daily GitHub outreach limit reached";
        continue;
      }

      if (dryRun) {
        delivered = true;
        byMethod[candidate.method] = (byMethod[candidate.method] ?? 0) + 1;
        results.push({
          outreachId: record.id,
          targetName: record.targetName,
          targetUrl: record.targetUrl,
          status: "SENT",
          method: candidate.method,
          reason: "Dry-run mode",
        });
        break;
      }

      const result = await executeContactMethod({
        method: candidate.method,
        targetUrl: candidate.targetUrl,
        targetEmail: record.targetEmail,
        message,
        campaign: record.campaign,
      });

      const duplicateGithubIssue =
        candidate.method === ContactMethod.GITHUB_ISSUE &&
        result.success &&
        !result.sent &&
        typeof result.note === "string" &&
        result.note.toLowerCase().includes("already exists");

      if (duplicateGithubIssue) {
        delivered = true;
        byMethod[candidate.method] = (byMethod[candidate.method] ?? 0) + 1;

        await db.outreachRecord.update({
          where: { id: record.id },
          data: {
            status: OutreachStatus.SENT,
            sentAt: record.sentAt ?? new Date(),
            notes: appendNote(
              record.notes,
              `[${new Date().toISOString()}] Existing GitHub invite issue detected; marked as sent.`,
            ),
          },
        });

        results.push({
          outreachId: record.id,
          targetName: record.targetName,
          targetUrl: record.targetUrl,
          status: "SENT",
          method: candidate.method,
          reason: "Existing AgentLink invitation issue already open",
        });
        break;
      }

      if (result.success && result.sent) {
        delivered = true;
        byMethod[candidate.method] = (byMethod[candidate.method] ?? 0) + 1;
        if (candidate.method === ContactMethod.EMAIL_API) {
          emailRemaining -= 1;
        }
        if (candidate.method === ContactMethod.GITHUB_ISSUE) {
          githubRemaining -= 1;
        }

        await db.outreachRecord.update({
          where: { id: record.id },
          data: {
            status: OutreachStatus.SENT,
            sentAt: record.sentAt ?? new Date(),
            notes: appendNote(
              record.notes,
              `[${new Date().toISOString()}] Sent via ${candidate.method} (status=${result.status ?? "n/a"}).`,
            ),
          },
        });

        results.push({
          outreachId: record.id,
          targetName: record.targetName,
          targetUrl: record.targetUrl,
          status: "SENT",
          method: candidate.method,
        });
        break;
      }

      lastReason = result.error ?? result.note ?? "Delivery attempt failed";
    }

    if (delivered) {
      sent += 1;
      continue;
    }

    if (lastReason.includes("limit reached")) {
      skipped += 1;
      results.push({
        outreachId: record.id,
        targetName: record.targetName,
        targetUrl: record.targetUrl,
        status: "SKIPPED",
        reason: lastReason,
      });
      continue;
    }

    failed += 1;
    results.push({
      outreachId: record.id,
      targetName: record.targetName,
      targetUrl: record.targetUrl,
      status: "FAILED",
      reason: lastReason,
    });

    if (!dryRun) {
      await db.outreachRecord.update({
        where: { id: record.id },
        data: {
          notes: appendNote(record.notes, `[${new Date().toISOString()}] Failed: ${lastReason}.`),
        },
      });
    }
  }

  return {
    total: records.length,
    attempted,
    sent,
    failed,
    skipped,
    optedOut,
    byMethod,
    results,
  } satisfies OutreachExecutionSummary;
}

export async function markOutreachResponded(outreachId: string, registered: boolean) {
  return db.outreachRecord.update({
    where: { id: outreachId },
    data: {
      status: registered ? OutreachStatus.REGISTERED : OutreachStatus.RESPONDED,
      respondedAt: new Date(),
    },
  });
}

export async function updateOutreachStatus(input: {
  outreachId: string;
  status: OutreachStatus;
  notes?: string;
}) {
  return db.outreachRecord.update({
    where: { id: input.outreachId },
    data: {
      status: input.status,
      ...(input.status === OutreachStatus.SENT ? { sentAt: new Date() } : {}),
      ...(input.status === OutreachStatus.RESPONDED || input.status === OutreachStatus.REGISTERED
        ? { respondedAt: new Date() }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function generateBulkOutreach(input: {
  importedAgents: ImportedAgent[];
  templateKey: OutreachTemplateKey;
  campaign: string;
  adminUserId: string;
}) {
  const messages: Array<{
    targetName: string;
    subject: string;
    body: string;
    inviteUrl: string;
  }> = [];
  let skipped = 0;

  for (const importedAgent of input.importedAgents) {
    const exists = await db.outreachRecord.findUnique({
      where: { targetUrl: importedAgent.sourceUrl },
      select: { id: true },
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    const created = await createOutreachRecord({
      targetUrl: importedAgent.sourceUrl,
      targetName: importedAgent.name,
      platform: importedAgent.sourcePlatform,
      templateKey: input.templateKey,
      adminUserId: input.adminUserId,
      campaign: input.campaign,
      agentName: importedAgent.name,
    });

    messages.push({
      targetName: importedAgent.name,
      subject: created.message.subject,
      body: created.message.body,
      inviteUrl: created.message.inviteUrl,
    });
  }

  return {
    generated: messages.length,
    skipped,
    messages,
  };
}

export async function listOutreachRecords(query: {
  platform?: string;
  status?: OutreachStatus;
  campaign?: string;
  page: number;
  limit: number;
}) {
  const where = {
    ...(query.platform ? { platform: query.platform } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.campaign ? { campaign: query.campaign } : {}),
  };
  const skip = (query.page - 1) * query.limit;

  const [data, total] = await db.$transaction([
    db.outreachRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
      include: {
        inviteToken: {
          select: {
            token: true,
          },
        },
      },
    }),
    db.outreachRecord.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
