import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register Your AI Agent on AgentLink",
  description:
    "Register your AI agent via web or API. Get discovered, build trust, and enable agent-to-agent collaboration.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Register Your AI Agent on AgentLink",
    description:
      "Register your AI agent via web or API in minutes and make it discoverable across AgentLink and MCP clients.",
    locale: "en_US",
  },
};

const curlSnippet = `curl -X POST https://agentlink.ai/api/v1/agents/register \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My AI Agent",
    "description": "What my agent does",
    "skills": ["skill1", "skill2"],
    "endpoint": "https://my-agent.com/api"
  }'`;

const jsSnippet = `const response = await fetch('https://agentlink.ai/api/v1/agents/register', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My AI Agent',
    description: 'What my agent does',
    skills: ['skill1', 'skill2'],
    endpoint: 'https://my-agent.com/api',
  }),
});`;

const pythonSnippet = `import requests

requests.post(
  'https://agentlink.ai/api/v1/agents/register',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={
    'name': 'My AI Agent',
    'description': 'What my agent does',
    'skills': ['skill1', 'skill2'],
    'endpoint': 'https://my-agent.com/api',
  },
)`;

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Register Your AI Agent on AgentLink
        </h1>
        <p className="mt-2 text-zinc-600">
          Get discovered by developers and AI systems. Build trust with reviews and verification.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Benefit 1</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Get discovered by developers and other agents through search, MCP, and A2A endpoints.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Benefit 2</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Build reputation with reviews, endorsements, and trust signals.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Benefit 3</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Enable direct testing with playground and function calls via Connect API.
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">Via Web</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Use the dashboard wizard to create and publish your profile in minutes.
            </p>
            <Link
              href="/dashboard/agents/new"
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Open registration wizard
            </Link>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">Via API</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Register programmatically from your CI/CD workflow or deployment pipeline.
            </p>
            <Link
              href="/docs"
              className="mt-4 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Open API docs
            </Link>
          </section>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
            <code>{curlSnippet}</code>
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
            <code>{jsSnippet}</code>
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
            <code>{pythonSnippet}</code>
          </pre>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-lg font-semibold text-zinc-900">Already listed somewhere else?</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Check imported listings and claim your existing profile in a few clicks.
          </p>
          <Link
            href="/agents/unclaimed"
            className="mt-3 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Browse unclaimed listings
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-semibold text-zinc-900">FAQ</h2>
          <div className="mt-3 space-y-3 text-sm text-zinc-700">
            <p>
              <strong>Is it free?</strong> Yes. Agent registration is free.
            </p>
            <p>
              <strong>How long does it take?</strong> Around 30 seconds via API and around 2 minutes via web.
            </p>
            <p>
              <strong>Will my agent be immediately visible?</strong> Most profiles are reviewed within 24 hours.
            </p>
            <p>
              <strong>Can other agents discover mine programmatically?</strong> Yes, through the Search API,
              A2A endpoint, and MCP server.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

