import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";

function generateToken() {
  return `inv_${randomBytes(6).toString("hex")}`;
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

function isExpired(expiresAt: Date | null) {
  if (!expiresAt) {
    return false;
  }

  return expiresAt.getTime() <= Date.now();
}

export async function createInvite(input: {
  campaign: string;
  agentName?: string;
  agentData?: Record<string, unknown>;
  maxUses?: number;
  expiresAt?: Date | null;
  adminUserId: string;
}) {
  const token = generateToken();
  const invite = await db.inviteToken.create({
    data: {
      token,
      campaign: input.campaign,
      agentName: input.agentName,
      agentData: input.agentData as Prisma.InputJsonValue | undefined,
      maxUses: input.maxUses ?? 1,
      expiresAt: input.expiresAt ?? null,
      createdByUserId: input.adminUserId,
    },
  });

  return {
    token: invite.token,
    url: `${baseUrl()}/join/${invite.token}`,
    campaign: invite.campaign,
    agentName: invite.agentName,
  };
}

export async function createBulkInvites(
  agents: Array<{
    name: string;
    description?: string;
    skills?: string[];
    url?: string;
  }>,
  campaign: string,
  adminUserId: string,
) {
  const invites = [];

  for (const agent of agents) {
    const invite = await createInvite({
      campaign,
      agentName: agent.name,
      agentData: {
        name: agent.name,
        description: agent.description,
        skills: agent.skills ?? [],
        websiteUrl: agent.url,
      },
      adminUserId,
    });
    invites.push(invite);
  }

  return invites;
}

export async function getInviteByToken(token: string) {
  return db.inviteToken.findUnique({
    where: { token },
  });
}

export async function validateInviteToken(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite) {
    return null;
  }

  if (isExpired(invite.expiresAt) || invite.usedCount >= invite.maxUses) {
    return null;
  }

  return invite;
}

export async function redeemInvite(token: string, userId: string) {
  const invite = await validateInviteToken(token);
  if (!invite) {
    throw new AgentServiceError(404, "NOT_FOUND", "Invite is invalid or expired");
  }

  const updated = await db.inviteToken.update({
    where: { id: invite.id },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });

  return {
    invite: updated,
    preFillData:
      updated.agentData && typeof updated.agentData === "object" && !Array.isArray(updated.agentData)
        ? (updated.agentData as Record<string, unknown>)
        : null,
    userId,
  };
}

export async function listInvites(query: {
  campaign?: string;
  status?: "active" | "used" | "expired";
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;
  const now = new Date();

  const where: Prisma.InviteTokenWhereInput = {
    ...(query.campaign ? { campaign: query.campaign } : {}),
    ...(query.status === "active"
      ? {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          usedCount: { lt: 1_000_000 },
        }
      : {}),
    ...(query.status === "used"
      ? {
          usedCount: { gte: 1 },
        }
      : {}),
    ...(query.status === "expired"
      ? {
          expiresAt: { lte: now },
        }
      : {}),
  };

  const [data, total] = await db.$transaction([
    db.inviteToken.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    db.inviteToken.count({ where }),
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



