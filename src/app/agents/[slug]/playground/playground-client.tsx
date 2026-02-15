"use client";

import { useMemo, useState } from "react";

interface PlaygroundEndpoint {
  id: string;
  type: string;
  url: string;
  method: string | null;
  requestSchema: unknown;
  responseSchema: unknown;
  description: string | null;
  healthStatus: string;
  isDefault: boolean;
}

interface RecentSession {
  id: string;
  requestBody: unknown;
  responseStatus: number | null;
  responseTimeMs: number | null;
  createdAt: string;
}

interface PlaygroundClientProps {
  slug: string;
  agentName: string;
  documentationUrl: string | null;
  endpoints: PlaygroundEndpoint[];
  recentSessions: RecentSession[];
}

interface PlaygroundResult {
  response: unknown;
  status: number | null;
  timeMs: number | null;
  error: string | null;
}

function parseSchemaProperties(schema: unknown) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return [];
  }

  const properties = (schema as Record<string, unknown>).properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return [];
  }

  return Object.entries(properties as Record<string, unknown>).map(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { key, type: "string", description: "" };
    }

    const config = value as Record<string, unknown>;
    return {
      key,
      type: typeof config.type === "string" ? config.type : "string",
      description: typeof config.description === "string" ? config.description : "",
    };
  });
}

function statusStyle(status: number | null) {
  if (status === null) {
    return "bg-zinc-100 text-zinc-700";
  }
  if (status >= 200 && status < 300) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status >= 400 && status < 500) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-rose-100 text-rose-700";
}

function tryParseObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function stringifyPretty(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function PlaygroundClient({
  slug,
  agentName,
  documentationUrl,
  endpoints,
  recentSessions,
}: PlaygroundClientProps) {
  const defaultEndpointId = endpoints.find((endpoint) => endpoint.isDefault)?.id ?? endpoints[0]?.id ?? "";
  const [endpointId, setEndpointId] = useState(defaultEndpointId);
  const [requestBody, setRequestBody] = useState("{\n  \"query\": \"Hello\"\n}");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === endpointId) ?? endpoints[0] ?? null,
    [endpointId, endpoints],
  );
  const schemaFields = useMemo(
    () => parseSchemaProperties(activeEndpoint?.requestSchema),
    [activeEndpoint?.requestSchema],
  );

  async function submitPlaygroundRequest() {
    const parsedBody = tryParseObject(requestBody);
    if (!parsedBody) {
      setError("Request body must be a valid JSON object.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/playground`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointId: activeEndpoint?.id,
          body: parsedBody,
        }),
      });

      const data = (await response.json()) as
        | { data: PlaygroundResult }
        | { error: { message?: string } };

      if (!response.ok || !("data" in data)) {
        const message = "error" in data ? data.error?.message ?? "Playground request failed" : "Playground request failed";
        setError(message);
        return;
      }

      setResult(data.data);
    } catch {
      setError("Failed to send playground request.");
    } finally {
      setLoading(false);
    }
  }

  function handleSchemaFieldChange(key: string, type: string, value: string) {
    const parsedBody = tryParseObject(requestBody) ?? {};

    let castValue: unknown = value;
    if (type === "number" || type === "integer") {
      castValue = value.length > 0 ? Number(value) : null;
    }
    if (type === "boolean") {
      castValue = value === "true";
    }

    parsedBody[key] = castValue;
    setRequestBody(stringifyPretty(parsedBody));
  }

  async function copyCurl() {
    const parsedBody = tryParseObject(requestBody) ?? {};
    const method = activeEndpoint?.method ?? "POST";
    const endpointUrl = activeEndpoint?.url ?? "<endpoint>";
    const curl = `curl -X ${method} '${endpointUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <REDACTED>' \\
  -d '${JSON.stringify(parsedBody)}'`;

    await navigator.clipboard.writeText(curl);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Playground: {agentName}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Send requests through AgentLink's secure proxy. Secrets are kept server-side.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Request builder</h2>
          <label className="block text-sm font-medium text-zinc-700">
            Endpoint
            <select
              value={endpointId}
              onChange={(event) => setEndpointId(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            >
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.type} - {endpoint.url}
                </option>
              ))}
            </select>
          </label>

          {schemaFields.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-700">Schema fields</p>
              <div className="mt-3 space-y-3">
                {schemaFields.map((field) => (
                  <label key={field.key} className="block text-xs text-zinc-600">
                    {field.key}
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800"
                      placeholder={field.description || `${field.type} value`}
                      onChange={(event) =>
                        handleSchemaFieldChange(field.key, field.type, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <label className="block text-sm font-medium text-zinc-700">
            JSON body
            <textarea
              value={requestBody}
              onChange={(event) => setRequestBody(event.target.value)}
              rows={12}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-950 p-3 font-mono text-xs text-zinc-100"
              spellCheck={false}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitPlaygroundRequest}
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send request"}
            </button>
            <button
              type="button"
              onClick={copyCurl}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Copy as cURL
            </button>
            {documentationUrl ? (
              <a
                href={documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Open docs
              </a>
            ) : null}
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Response</h2>
          {result ? (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyle(result.status)}`}>
                  {result.status ?? "N/A"}
                </span>
                <span className="text-zinc-600">{result.timeMs ?? "-"} ms</span>
                {result.error ? <span className="text-rose-600">{result.error}</span> : null}
              </div>
              <pre className="max-h-[460px] overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                {stringifyPretty(result.response ?? { error: result.error })}
              </pre>
            </>
          ) : (
            <p className="text-sm text-zinc-600">
              Send a request to inspect the endpoint response.
            </p>
          )}
        </div>
      </div>

      {recentSessions.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recent requests</h2>
          <div className="mt-3 space-y-2">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setRequestBody(stringifyPretty(session.requestBody))}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <span>{new Date(session.createdAt).toLocaleString()}</span>
                <span>
                  {session.responseStatus ?? "N/A"} | {session.responseTimeMs ?? "-"} ms
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
