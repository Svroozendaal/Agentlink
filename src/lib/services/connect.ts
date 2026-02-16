import { ConnectStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import { trackDiscoveryInvocation } from "@/lib/services/discovery";
import { getDefaultEndpoint } from "@/lib/services/endpoints";
import { executeEndpointProxy } from "@/lib/services/proxy-request";
import { assertRateLimit } from "@/lib/services/rate-limit";
import { triggerAgentWebhooks } from "@/lib/services/webhooks";
import type { ConnectLogQueryInput } from "@/lib/validations/connect";

function determineConnectStatus(result: {
  status: number | null;
  error: string | null;
}): ConnectStatus {
  if (result.error) {
    if (result.status === 504) {
      return ConnectStatus.TIMEOUT;
    }

    return ConnectStatus.FAILED;
  }

  if (result.status && result.status >= 200 && result.status < 400) {
    return ConnectStatus.SUCCESS;
  }

  return ConnectStatus.FAILED;
}

async function resolveFromAgent(slug: string, userId: string) {
  const fromAgent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!fromAgent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Source agent not found");
  }

  if (fromAgent.ownerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own the source agent");
  }

  return fromAgent;
}

async function resolveToAgent(slug: string) {
  const toAgent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      connectEnabled: true,
    },
  });

  if (!toAgent || !toAgent.isPublished) {
    throw new AgentServiceError(404, "NOT_FOUND", "Target agent not found");
  }

  if (!toAgent.connectEnabled) {
    throw new AgentServiceError(403, "CONNECT_DISABLED", "Connect is not enabled for this agent");
  }

  return toAgent;
}

function readRequiredFields(requestSchema: unknown): string[] {
  if (!requestSchema || typeof requestSchema !== "object" || Array.isArray(requestSchema)) {
    return [];
  }

  const required = (requestSchema as Record<string, unknown>).required;
  if (!Array.isArray(required)) {
    return [];
  }

  return required.filter((value): value is string => typeof value === "string");
}

function validateAgainstSimpleSchema(requestSchema: unknown, body: Record<string, unknown>) {
  const requiredFields = readRequiredFields(requestSchema);
  for (const field of requiredFields) {
    if (!(field in body)) {
      throw new AgentServiceError(400, "VALIDATION_ERROR", `Missing required field: ${field}`);
    }
  }
}

export async function executeConnectRequest(input: {
  fromAgentSlug: string;
  toAgentSlug: string;
  requestBody: Record<string, unknown>;
  userId: string;
  apiKeyId: string;
  endpointId?: string;
  discoveryQuery?: string;
}) {
  const [fromAgent, toAgent] = await Promise.all([
    resolveFromAgent(input.fromAgentSlug, input.userId),
    resolveToAgent(input.toAgentSlug),
  ]);

  const endpoint = await getDefaultEndpoint(toAgent.id, input.endpointId);
  if (!endpoint) {
    throw new AgentServiceError(400, "NO_ENDPOINT", "Target agent has no configured endpoint");
  }

  validateAgainstSimpleSchema(endpoint.requestSchema, input.requestBody);

  assertRateLimit({
    bucket: "connect",
    identifier: input.apiKeyId,
    max: 50,
    windowMs: 60 * 60 * 1_000,
  });

  const proxyResult = await executeEndpointProxy({
    endpoint,
    body: input.requestBody,
    timeoutMs: 30_000,
  });
  const status = determineConnectStatus(proxyResult);

  const connectRequest = await db.connectRequest.create({
    data: {
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      endpointId: endpoint.id,
      requestBody: input.requestBody as Prisma.InputJsonValue,
      responseBody: proxyResult.response as Prisma.InputJsonValue | undefined,
      responseStatus: proxyResult.status ?? undefined,
      responseTimeMs: proxyResult.timeMs ?? undefined,
      status,
      error: proxyResult.error ?? undefined,
    },
  });

  await createActivityEvent({
    type: "AGENT_CONNECTED",
    actorAgentId: fromAgent.id,
    targetAgentId: toAgent.id,
    metadata: {
      connectRequestId: connectRequest.id,
      from: fromAgent.slug,
      to: toAgent.slug,
      status,
    },
  });

  await triggerAgentWebhooks(toAgent.id, "connect.request", {
    connectId: connectRequest.id,
    from: fromAgent.slug,
    to: toAgent.slug,
    status,
    responseStatus: proxyResult.status,
  });

  await trackDiscoveryInvocation({
    discovererSlug: fromAgent.slug,
    discoveredSlug: toAgent.slug,
    invocationMethod: endpoint.type,
    searchQuery: input.discoveryQuery,
    source: "connect-api",
  });

  return {
    connectId: connectRequest.id,
    from: fromAgent.slug,
    to: toAgent.slug,
    response: proxyResult.response,
    status: proxyResult.status,
    timeMs: proxyResult.timeMs,
    error: proxyResult.error,
  };
}

async function resolveStatsAccess(slug: string, requesterUserId: string, isAdmin = false) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (!isAdmin && agent.ownerId !== requesterUserId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  return agent;
}

export async function getConnectStats(slug: string, requesterUserId: string, isAdmin = false) {
  const agent = await resolveStatsAccess(slug, requesterUserId, isAdmin);

  const [receivedTotal, receivedSuccess, sentTotal, sentSuccess, avgResponse] = await Promise.all([
    db.connectRequest.count({
      where: { toAgentId: agent.id },
    }),
    db.connectRequest.count({
      where: {
        toAgentId: agent.id,
        status: ConnectStatus.SUCCESS,
      },
    }),
    db.connectRequest.count({
      where: { fromAgentId: agent.id },
    }),
    db.connectRequest.count({
      where: {
        fromAgentId: agent.id,
        status: ConnectStatus.SUCCESS,
      },
    }),
    db.connectRequest.aggregate({
      where: {
        OR: [{ fromAgentId: agent.id }, { toAgentId: agent.id }],
      },
      _avg: { responseTimeMs: true },
    }),
  ]);

  return {
    received: {
      total: receivedTotal,
      success: receivedSuccess,
      failed: Math.max(0, receivedTotal - receivedSuccess),
    },
    sent: {
      total: sentTotal,
      success: sentSuccess,
      failed: Math.max(0, sentTotal - sentSuccess),
    },
    avgResponseMs: Math.round(avgResponse._avg.responseTimeMs ?? 0),
  };
}

export async function getConnectLog(
  slug: string,
  requesterUserId: string,
  query: ConnectLogQueryInput,
) {
  const agent = await resolveStatsAccess(slug, requesterUserId);
  const where: Prisma.ConnectRequestWhereInput =
    query.direction === "sent"
      ? { fromAgentId: agent.id }
      : query.direction === "received"
        ? { toAgentId: agent.id }
        : {
            OR: [{ fromAgentId: agent.id }, { toAgentId: agent.id }],
          };

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await db.$transaction([
    db.connectRequest.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        responseStatus: true,
        responseTimeMs: true,
        error: true,
        createdAt: true,
        fromAgent: { select: { slug: true, name: true } },
        toAgent: { select: { slug: true, name: true } },
      },
    }),
    db.connectRequest.count({ where }),
  ]);

  return {
    data: rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
