import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { getDefaultEndpoint } from "@/lib/services/endpoints";
import { executeEndpointProxy } from "@/lib/services/proxy-request";
import { assertRateLimit } from "@/lib/services/rate-limit";

const PLAYGROUND_TIMEOUT_MS = 30_000;

function readRequiredFields(requestSchema: unknown): string[] {
  if (!requestSchema || typeof requestSchema !== "object" || Array.isArray(requestSchema)) {
    return [];
  }

  const required = (requestSchema as Record<string, unknown>).required;
  if (!Array.isArray(required)) {
    return [];
  }

  return required.filter((field): field is string => typeof field === "string");
}

function validateAgainstSimpleSchema(requestSchema: unknown, body: Record<string, unknown>) {
  const requiredFields = readRequiredFields(requestSchema);
  for (const field of requiredFields) {
    if (!(field in body)) {
      throw new AgentServiceError(400, "VALIDATION_ERROR", `Missing required field: ${field}`);
    }
  }
}

async function resolvePlaygroundAgent(slug: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      playgroundEnabled: true,
      ownerId: true,
    },
  });

  if (!agent || !agent.isPublished) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (!agent.playgroundEnabled) {
    throw new AgentServiceError(403, "PLAYGROUND_DISABLED", "Playground is not enabled for this agent");
  }

  return agent;
}

function sanitizeResponseBody(response: unknown) {
  if (typeof response === "string") {
    return response.length > 20_000 ? `${response.slice(0, 20_000)}...` : response;
  }

  return response;
}

export async function executePlaygroundRequest(input: {
  agentSlug: string;
  requestBody: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  endpointId?: string;
  rateBucket?: string;
}) {
  const agent = await resolvePlaygroundAgent(input.agentSlug);

  const endpoint = await getDefaultEndpoint(agent.id, input.endpointId);
  if (!endpoint) {
    throw new AgentServiceError(400, "NO_ENDPOINT", "Agent has no configured endpoint");
  }

  validateAgainstSimpleSchema(endpoint.requestSchema, input.requestBody);

  const bucket = input.rateBucket ?? "playground";
  if (input.userId) {
    assertRateLimit({
      bucket,
      identifier: `user:${input.userId}`,
      max: bucket === "mcp-playground" ? 50 : 20,
      windowMs: 60 * 60 * 1_000,
    });
  } else {
    assertRateLimit({
      bucket,
      identifier: `ip:${input.ipAddress ?? "anonymous"}`,
      max: bucket === "mcp-playground" ? 50 : 5,
      windowMs: 60 * 60 * 1_000,
    });
  }

  const result = await executeEndpointProxy({
    endpoint,
    body: input.requestBody,
    timeoutMs: PLAYGROUND_TIMEOUT_MS,
  });

  await db.playgroundSession.create({
    data: {
      agentId: agent.id,
      userId: input.userId,
      endpointId: endpoint.id,
      requestBody: endpoint.logResponses
        ? (input.requestBody as Prisma.InputJsonValue)
        : ({ redacted: true } as Prisma.InputJsonValue),
      responseBody:
        endpoint.logResponses && result.response !== undefined
          ? (sanitizeResponseBody(result.response) as Prisma.InputJsonValue)
          : undefined,
      responseStatus: result.status ?? undefined,
      responseTimeMs: result.timeMs ?? undefined,
      error: result.error ?? undefined,
    },
  });

  return result;
}

export async function getPlaygroundStats(agentSlug: string, requesterUserId: string, isAdmin = false) {
  const agent = await db.agentProfile.findUnique({
    where: { slug: agentSlug },
    select: { id: true, ownerId: true },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (!isAdmin && agent.ownerId !== requesterUserId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000);

  const [totalRequests, last24h, aggregates] = await Promise.all([
    db.playgroundSession.count({
      where: { agentId: agent.id },
    }),
    db.playgroundSession.count({
      where: {
        agentId: agent.id,
        createdAt: { gte: since },
      },
    }),
    db.playgroundSession.aggregate({
      where: { agentId: agent.id },
      _avg: {
        responseTimeMs: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const successCount = await db.playgroundSession.count({
    where: {
      agentId: agent.id,
      responseStatus: { gte: 200, lt: 400 },
    },
  });

  const total = aggregates._count._all;

  return {
    totalRequests,
    avgResponseMs: Math.round(aggregates._avg.responseTimeMs ?? 0),
    successRate: total > 0 ? Number(((successCount / total) * 100).toFixed(1)) : 0,
    last24h: {
      requests: last24h,
    },
  };
}

export async function listRecentPlaygroundSessions(agentSlug: string, userId: string, limit = 5) {
  const agent = await db.agentProfile.findUnique({
    where: { slug: agentSlug },
    select: { id: true, ownerId: true },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (agent.ownerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  return db.playgroundSession.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 20)),
    select: {
      id: true,
      requestBody: true,
      responseStatus: true,
      responseTimeMs: true,
      error: true,
      createdAt: true,
    },
  });
}

