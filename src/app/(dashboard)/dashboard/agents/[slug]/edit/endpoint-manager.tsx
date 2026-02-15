"use client";

import { FormEvent, useEffect, useState } from "react";

interface EndpointRecord {
  id: string;
  type: string;
  url: string;
  method: string | null;
  healthStatus: string;
  isDefault: boolean;
}

interface EndpointManagerProps {
  slug: string;
}

const ENDPOINT_TYPES = ["REST", "A2A", "MCP", "GRAPHQL", "WEBSOCKET", "CUSTOM"] as const;

export function EndpointManager({ slug }: EndpointManagerProps) {
  const [endpoints, setEndpoints] = useState<EndpointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<(typeof ENDPOINT_TYPES)[number]>("REST");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadEndpoints() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/endpoints`);
      const payload = (await response.json()) as
        | { data: EndpointRecord[] }
        | { error?: { message?: string } };

      if (!response.ok || !("data" in payload)) {
        throw new Error("error" in payload ? payload.error?.message ?? "Failed to load endpoints" : "Failed to load endpoints");
      }

      setEndpoints(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load endpoints");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEndpoints();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          url,
          method: type === "REST" ? method : undefined,
          isDefault,
        }),
      });
      const payload = (await response.json()) as
        | { data: EndpointRecord }
        | { error?: { message?: string } };

      if (!response.ok || !("data" in payload)) {
        throw new Error("error" in payload ? payload.error?.message ?? "Failed to add endpoint" : "Failed to add endpoint");
      }

      setUrl("");
      setMethod("POST");
      setIsDefault(false);
      await loadEndpoints();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add endpoint");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEndpoint(endpointId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/v1/agents/${slug}/endpoints/${endpointId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Failed to remove endpoint");
      }

      await loadEndpoints();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove endpoint");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Endpoint management</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Configure up to five endpoints for playground and connect routing.
        </p>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading endpoints...</p> : null}

      {!loading ? (
        <div className="space-y-2">
          {endpoints.length > 0 ? (
            endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-800">
                    {endpoint.type} {endpoint.method ? `(${endpoint.method})` : ""}
                    {endpoint.isDefault ? " - default" : ""}
                  </p>
                  <p className="font-mono text-xs text-zinc-600">{endpoint.url}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase text-zinc-500">{endpoint.healthStatus}</span>
                  <button
                    type="button"
                    onClick={() => removeEndpoint(endpoint.id)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No endpoints configured yet.</p>
          )}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as (typeof ENDPOINT_TYPES)[number])}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
          >
            {ENDPOINT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-zinc-700">
          Method
          <input
            value={method}
            onChange={(event) => setMethod(event.target.value.toUpperCase())}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            disabled={type !== "REST"}
          />
        </label>

        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">
          URL
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.your-agent.com/v1"
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          Set as default endpoint
        </label>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
        >
          {isSaving ? "Adding endpoint..." : "Add endpoint"}
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}

