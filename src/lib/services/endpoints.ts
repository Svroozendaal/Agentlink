import { EndpointAuthType, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import type { AddEndpointInput, UpdateEndpointInput } from "@/lib/validations/endpoint";

const MAX_ENDPOINTS_PER_AGENT = 5;

const ENDPOINT_SELECT = {
  id: true,
  agentId: true,
  type: true,
  url: true,
  method: true,
  authType: true,
  authConfig: true,
  requestSchema: true,
  responseSchema: true,
  healthStatus: true,
  lastHealthCheck: true,
  description: true,
  isDefault: true,
  logResponses: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AgentEndpointSelect;

export type AgentEndpoint = Prisma.AgentEndpointGetPayload<{ select: typeof ENDPOINT_SELECT }>;
export type PublicAgentEndpoint = Omit<AgentEndpoint, "authConfig">;

function sanitizeEndpoint(endpoint: AgentEndpoint): PublicAgentEndpoint {
  const { authConfig: _authConfig, ...rest } = endpoint;
  return rest;
}

async function resolveOwnedAgent(slug: string, userId: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (agent.ownerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  return agent;
}

async function resolveEndpointOwnership(endpointId: string, userId: string) {
  const endpoint = await db.agentEndpoint.findUnique({
    where: { id: endpointId },
    select: {
      ...ENDPOINT_SELECT,
      agent: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw new AgentServiceError(404, "NOT_FOUND", "Endpoint not found");
  }

  if (endpoint.agent.ownerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this endpoint");
  }

  return endpoint;
}

function normalizeMethod(type: AgentEndpoint["type"], method?: string) {
  if (type !== "REST") {
    return undefined;
  }

  return (method ?? "POST").trim().toUpperCase();
}

function validateAuthConfig(input: AddEndpointInput | UpdateEndpointInput) {
  if (!input.authType || input.authType === EndpointAuthType.NONE) {
    return;
  }

  const authConfig = input.authConfig;
  if (!authConfig || typeof authConfig !== "object" || Array.isArray(authConfig)) {
    throw new AgentServiceError(400, "VALIDATION_ERROR", "authConfig is required for this authType");
  }
}

export async function addEndpoint(agentSlug: string, data: AddEndpointInput, userId: string) {
  const agent = await resolveOwnedAgent(agentSlug, userId);
  const endpointCount = await db.agentEndpoint.count({
    where: { agentId: agent.id },
  });

  if (endpointCount >= MAX_ENDPOINTS_PER_AGENT) {
    throw new AgentServiceError(400, "ENDPOINT_LIMIT", `An agent can have at most ${MAX_ENDPOINTS_PER_AGENT} endpoints`);
  }

  validateAuthConfig(data);

  return db.$transaction(async (tx) => {
    if (data.isDefault || endpointCount === 0) {
      await tx.agentEndpoint.updateMany({
        where: { agentId: agent.id },
        data: { isDefault: false },
      });
    }

    const endpoint = await tx.agentEndpoint.create({
      data: {
        agentId: agent.id,
        type: data.type,
        url: data.url,
        method: normalizeMethod(data.type, data.method),
        authType: data.authType,
        authConfig: data.authConfig as Prisma.InputJsonValue | undefined,
        requestSchema: data.requestSchema as Prisma.InputJsonValue | undefined,
        responseSchema: data.responseSchema as Prisma.InputJsonValue | undefined,
        description: data.description,
        isDefault: data.isDefault || endpointCount === 0,
        logResponses: data.logResponses,
      },
      select: ENDPOINT_SELECT,
    });

    return endpoint;
  });
}

export async function updateEndpoint(endpointId: string, data: UpdateEndpointInput, userId: string) {
  const endpoint = await resolveEndpointOwnership(endpointId, userId);
  validateAuthConfig(data);

  return db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.agentEndpoint.updateMany({
        where: { agentId: endpoint.agentId },
        data: { isDefault: false },
      });
    }

    return tx.agentEndpoint.update({
      where: { id: endpoint.id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.url ? { url: data.url } : {}),
        ...(data.method !== undefined || data.type
          ? { method: normalizeMethod(data.type ?? endpoint.type, data.method ?? endpoint.method ?? undefined) }
          : {}),
        ...(data.authType ? { authType: data.authType } : {}),
        ...(data.authConfig !== undefined
          ? { authConfig: data.authConfig as Prisma.InputJsonValue }
          : {}),
        ...(data.requestSchema !== undefined
          ? { requestSchema: data.requestSchema as Prisma.InputJsonValue }
          : {}),
        ...(data.responseSchema !== undefined
          ? { responseSchema: data.responseSchema as Prisma.InputJsonValue }
          : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.logResponses !== undefined ? { logResponses: data.logResponses } : {}),
      },
      select: ENDPOINT_SELECT,
    });
  });
}

export async function deleteEndpoint(endpointId: string, userId: string) {
  const endpoint = await resolveEndpointOwnership(endpointId, userId);

  await db.agentEndpoint.delete({
    where: {
      id: endpoint.id,
    },
  });

  return {
    message: "Endpoint removed",
  };
}

export async function listEndpoints(agentSlug: string, viewerUserId?: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug: agentSlug },
    select: { id: true, ownerId: true, isPublished: true },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  const isOwner = viewerUserId && agent.ownerId === viewerUserId;

  if (!agent.isPublished && !isOwner) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  const endpoints = await db.agentEndpoint.findMany({
    where: { agentId: agent.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: ENDPOINT_SELECT,
  });

  if (isOwner) {
    return endpoints;
  }

  return endpoints.map(sanitizeEndpoint);
}

export async function getDefaultEndpoint(agentId: string, endpointId?: string) {
  if (endpointId) {
    const explicit = await db.agentEndpoint.findFirst({
      where: {
        id: endpointId,
        agentId,
      },
      select: ENDPOINT_SELECT,
    });

    if (explicit) {
      return explicit;
    }
  }

  const selectedDefault = await db.agentEndpoint.findFirst({
    where: {
      agentId,
      isDefault: true,
    },
    orderBy: { createdAt: "asc" },
    select: ENDPOINT_SELECT,
  });

  if (selectedDefault) {
    return selectedDefault;
  }

  return db.agentEndpoint.findFirst({
    where: { agentId },
    orderBy: { createdAt: "asc" },
    select: ENDPOINT_SELECT,
  });
}

export async function listAllEndpoints() {
  return db.agentEndpoint.findMany({
    select: ENDPOINT_SELECT,
  });
}

