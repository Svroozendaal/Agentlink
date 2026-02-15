import { EndpointHealth } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { assertRateLimit } from "@/lib/services/rate-limit";

const CHECK_TIMEOUT_MS = 5_000;

export interface EndpointHealthResult {
  endpointId: string;
  status: EndpointHealth;
  responseTimeMs: number | null;
}

async function performHttpCheck(url: string, method: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      responseTimeMs: Date.now() - startedAt,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      responseTimeMs: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function evaluateHealth(result: { ok: boolean; responseTimeMs: number | null }) {
  if (!result.ok || result.responseTimeMs === null) {
    return EndpointHealth.DOWN;
  }

  if (result.responseTimeMs < 2_000) {
    return EndpointHealth.HEALTHY;
  }

  if (result.responseTimeMs <= 5_000) {
    return EndpointHealth.DEGRADED;
  }

  return EndpointHealth.DOWN;
}

export async function checkEndpointHealth(endpointId: string): Promise<EndpointHealthResult> {
  const endpoint = await db.agentEndpoint.findUnique({
    where: { id: endpointId },
    select: {
      id: true,
      url: true,
      type: true,
      method: true,
    },
  });

  if (!endpoint) {
    throw new AgentServiceError(404, "NOT_FOUND", "Endpoint not found");
  }

  const result =
    endpoint.type === "REST"
      ? await performHttpCheck(endpoint.url, "HEAD")
      : await performHttpCheck(endpoint.url, endpoint.method ?? "GET");

  const health = evaluateHealth(result);

  await db.agentEndpoint.update({
    where: { id: endpoint.id },
    data: {
      healthStatus: health,
      lastHealthCheck: new Date(),
    },
  });

  return {
    endpointId: endpoint.id,
    status: health,
    responseTimeMs: result.responseTimeMs,
  };
}

export async function checkAllEndpointsHealth() {
  assertRateLimit({
    bucket: "admin-health-check",
    identifier: "global",
    max: 1,
    windowMs: 5 * 60 * 1_000,
  });

  const endpoints = await db.agentEndpoint.findMany({
    select: { id: true },
  });

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => checkEndpointHealth(endpoint.id)),
  );

  let healthy = 0;
  let degraded = 0;
  let down = 0;

  for (const result of results) {
    if (result.status !== "fulfilled") {
      down += 1;
      continue;
    }

    if (result.value.status === EndpointHealth.HEALTHY) {
      healthy += 1;
      continue;
    }

    if (result.value.status === EndpointHealth.DEGRADED) {
      degraded += 1;
      continue;
    }

    down += 1;
  }

  return {
    checked: endpoints.length,
    healthy,
    degraded,
    down,
  };
}

