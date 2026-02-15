import type { AgentEndpoint } from "@/lib/services/endpoints";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface ProxyExecutionResult {
  response: unknown;
  status: number | null;
  timeMs: number | null;
  error: string | null;
}

function parseAuthConfig(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  return input as Record<string, unknown>;
}

function toJsonIfPossible(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function safeHeaderValue(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return value;
}

function buildAuthHeaders(endpoint: AgentEndpoint): HeadersInit {
  const headers: Record<string, string> = {};
  const authConfig = parseAuthConfig(endpoint.authConfig);

  if (!authConfig || endpoint.authType === "NONE") {
    return headers;
  }

  if (endpoint.authType === "API_KEY") {
    const headerName = safeHeaderValue(authConfig.headerName) ?? "X-API-Key";
    const key = safeHeaderValue(authConfig.key);
    if (key) {
      headers[headerName] = key;
    }
  }

  if (endpoint.authType === "BEARER") {
    const token = safeHeaderValue(authConfig.token);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (endpoint.authType === "BASIC") {
    const username = safeHeaderValue(authConfig.username);
    const password = safeHeaderValue(authConfig.password);
    if (username && password) {
      headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    }
  }

  if (endpoint.authType === "CUSTOM") {
    const customHeaders = authConfig.headers;
    if (customHeaders && typeof customHeaders === "object" && !Array.isArray(customHeaders)) {
      for (const [key, value] of Object.entries(customHeaders as Record<string, unknown>)) {
        const cast = safeHeaderValue(value);
        if (cast) {
          headers[key] = cast;
        }
      }
    }
  }

  return headers;
}

export async function executeEndpointProxy(input: {
  endpoint: AgentEndpoint;
  body: Record<string, unknown>;
  timeoutMs?: number;
}) {
  const endpointMethod =
    input.endpoint.type === "REST" ? (input.endpoint.method ?? "POST") : "POST";
  const method = endpointMethod.toUpperCase();
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(input.endpoint.url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(input.endpoint),
      },
      body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(input.body),
      signal: controller.signal,
    });

    const raw = await response.text();
    const parsed = toJsonIfPossible(raw);

    return {
      response: parsed,
      status: response.status,
      timeMs: Date.now() - startedAt,
      error: null,
    } satisfies ProxyExecutionResult;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        response: null,
        status: 504,
        timeMs: Date.now() - startedAt,
        error: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
      } satisfies ProxyExecutionResult;
    }

    return {
      response: null,
      status: 502,
      timeMs: Date.now() - startedAt,
      error: "Failed to reach the endpoint",
    } satisfies ProxyExecutionResult;
  } finally {
    clearTimeout(timeout);
  }
}

