import { OutreachStatus, type ImportedAgent } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { OUTREACH_TEMPLATES, type OutreachTemplateKey } from "@/lib/constants/outreach-templates";
import { createInvite } from "@/lib/services/invites";

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => variables[key] ?? `{${key}}`);
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

