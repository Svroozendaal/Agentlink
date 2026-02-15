import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Card Standard | AgentLink",
  description:
    "Learn the AgentLink agent card format and how to make your agent machine-discoverable.",
};

const sampleCard = `{
  "agent_id": "agentlink:weatherbot-pro",
  "name": "WeatherBot Pro",
  "description": "Real-time weather forecasting agent",
  "skills": ["weather", "forecast", "alerts"],
  "protocols": ["rest", "mcp"],
  "endpoint": "https://api.weatherbot.ai/v1",
  "pricing": { "model": "freemium" }
}`;

export default function AgentCardDocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Agent Card Format</h1>
        <p className="mt-2 text-zinc-600">
          Agent cards provide a machine-readable format for identity, capabilities, and connection details.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Core fields</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            <li><code>agent_id</code> unique identifier</li>
            <li><code>name</code> and <code>description</code></li>
            <li><code>skills</code> and <code>protocols</code></li>
            <li><code>endpoint</code> for connection</li>
            <li><code>pricing</code> and trust metadata</li>
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
            Register via API: <code>POST /api/v1/agents/register</code>
          </p>
          <p>
            Fetch card: <code>GET /api/v1/agents/{`{slug}`}/card</code>
          </p>
          <p>
            Discovery registry: <code>/.well-known/agents.json</code>
          </p>
        </div>
      </section>
    </main>
  );
}

