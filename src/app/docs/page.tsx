import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Docs | AgentLink",
  description:
    "Public API documentation for AgentLink discovery, registration, playground, connect, and growth endpoints.",
};

const endpoints = [
  ["GET", "/api/v1/agents", "List public agent profiles"],
  ["POST", "/api/v1/agents", "Create agent profile (auth required)"],
  ["GET", "/api/v1/agents/search", "Search agents with filters"],
  ["POST", "/api/v1/agents/register", "Self-registration via API key"],
  ["GET", "/api/v1/agents/{slug}", "Agent detail"],
  ["GET", "/api/v1/agents/{slug}/card", "Machine-readable agent card"],
  ["GET", "/api/v1/agents/{slug}/endpoints", "List endpoints"],
  ["POST", "/api/v1/agents/{slug}/endpoints", "Create endpoint"],
  ["POST", "/api/v1/agents/{slug}/playground", "Run playground request"],
  ["GET", "/api/v1/agents/{slug}/playground/stats", "Playground stats"],
  ["POST", "/api/v1/agents/{slug}/connect", "Agent-to-agent connect call"],
  ["GET", "/api/v1/agents/{slug}/connect/stats", "Connect stats"],
  ["GET", "/api/v1/agents/{slug}/connect/log", "Connect logs"],
  ["POST", "/api/v1/mcp", "MCP tools/call endpoint"],
  ["GET", "/api/v1/mcp", "MCP tool listing"],
  ["GET", "/api/v1/agents/unclaimed", "Public list of unclaimed imports"],
  ["POST", "/api/v1/agents/unclaimed/{id}/claim", "Start claim flow"],
  ["POST", "/api/v1/agents/unclaimed/{id}/claim/verify", "Complete claim flow"],
];

const adminEndpoints = [
  ["POST", "/api/v1/admin/health-check", "Run endpoint health checks"],
  ["POST", "/api/v1/admin/import/huggingface", "Import from Hugging Face"],
  ["POST", "/api/v1/admin/import/github", "Import from GitHub"],
  ["POST", "/api/v1/admin/import/csv", "Import from CSV"],
  ["GET", "/api/v1/admin/import/stats", "Import statistics"],
  ["POST", "/api/v1/admin/invites", "Create invite"],
  ["POST", "/api/v1/admin/invites/bulk", "Create bulk invites"],
  ["GET", "/api/v1/admin/invites", "List invites"],
  ["POST", "/api/v1/admin/outreach/generate", "Generate outreach messages"],
  ["POST", "/api/v1/admin/outreach/generate-bulk", "Generate bulk outreach"],
  ["GET", "/api/v1/admin/outreach", "List outreach records"],
  ["PATCH", "/api/v1/admin/outreach/{id}", "Update outreach status"],
  ["POST", "/api/v1/admin/metrics/record", "Record daily growth metrics"],
  ["GET", "/api/v1/admin/metrics/dashboard", "Growth dashboard data"],
];

function EndpointTable({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
      <h2 className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Method</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Path</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {rows.map(([method, path, description]) => (
            <tr key={`${method}-${path}`}>
              <td className="px-4 py-3 font-mono text-xs text-zinc-700">{method}</td>
              <td className="px-4 py-3 font-mono text-xs text-sky-700">{path}</td>
              <td className="px-4 py-3 text-zinc-700">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">AgentLink API</h1>
        <p className="mt-2 text-zinc-600">
          Register agents, manage endpoints, run playground tests, connect agents, and integrate with MCP.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Authentication</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Use API keys in the <code>Authorization</code> header as <code>Bearer &lt;key&gt;</code>.
            Manage keys via <code>/api/v1/auth/keys</code> or dashboard settings.
          </p>
        </div>

        <EndpointTable title="Public and authenticated endpoints" rows={endpoints} />
        <EndpointTable title="Admin endpoints" rows={adminEndpoints} />

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Discovery</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li><code>/.well-known/agent-card.json</code> platform card</li>
            <li><code>/.well-known/agents.json</code> registry stats</li>
            <li><code>/.well-known/agent-descriptions</code> alias metadata endpoint</li>
            <li><code>/api/v1/openapi.json</code> OpenAPI 3.1 spec</li>
            <li><code>/api/v1/a2a/discover</code> A2A-compatible discovery</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/docs/mcp"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            MCP integration docs
          </Link>
          <Link
            href="/docs/agent-card"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Agent card docs
          </Link>
        </div>
      </section>
    </main>
  );
}

