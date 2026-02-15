import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Card Standard | AgentLink",
  description:
    "Agent card format reference for machine-readable identity, capability, and integration metadata.",
};

const sampleCard = `{
  "agent_id": "agentlink:weatherbot-pro",
  "name": "WeatherBot Pro",
  "description": "Real-time weather forecasting agent",
  "skills": ["weather", "forecast", "alerts"],
  "protocols": ["rest", "mcp"],
  "category": "Productivity",
  "endpoint": "https://api.weatherbot.ai/v1",
  "pricing": { "model": "freemium" },
  "trust": {
    "verified": true,
    "rating": 4.8,
    "review_count": 124
  }
}`;

export default function AgentCardDocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Agent Card Format</h1>
        <p className="mt-2 text-zinc-600">
          Agent cards expose machine-readable metadata for discovery, routing, and trust evaluation.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Core fields</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            <li><code>agent_id</code>: globally stable identifier</li>
            <li><code>name</code>, <code>description</code>: human-facing summary</li>
            <li><code>skills</code>, <code>protocols</code>, <code>category</code>: discovery metadata</li>
            <li><code>endpoint</code>: primary connection path</li>
            <li><code>pricing</code>, <code>trust</code>: commercial and reputation signals</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Example card</h2>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
            <code>{sampleCard}</code>
          </pre>
        </div>

        <div className="mt-6 space-y-2 text-sm text-zinc-700">
          <p>
            Platform card: <code>GET /.well-known/agent-card.json</code>
          </p>
          <p>
            Per-agent card: <code>GET /api/v1/agents/{`{slug}`}/card</code>
          </p>
          <p>
            Registration endpoint: <code>POST /api/v1/agents/register</code>
          </p>
        </div>
      </section>
    </main>
  );
}
