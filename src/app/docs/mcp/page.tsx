import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Integration | AgentLink",
  description:
    "Connect AgentLink as an MCP server to search agents, inspect profiles, run playground tests, and fetch reviews.",
};

const claudeConfig = `{
  "mcpServers": {
    "agentlink": {
      "url": "https://agentlink.ai/api/v1/mcp"
    }
  }
}`;

const requestExample = `{
  "method": "tools/call",
  "params": {
    "name": "search_agents",
    "arguments": {
      "query": "weather forecast",
      "limit": 5
    }
  }
}`;

export default function McpDocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          AgentLink MCP Server
        </h1>
        <p className="mt-2 text-zinc-600">
          Add AgentLink to Claude Desktop, Claude Code, or any MCP-compatible client to discover and
          test agents programmatically.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            1. Add To Client Config
          </h2>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
            <code>{claudeConfig}</code>
          </pre>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            2. Available Tools
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            <li>
              <code>search_agents</code> - Find agents by query, skill, category, and protocol.
            </li>
            <li>
              <code>get_agent_profile</code> - Read full profile details including endpoint and trust
              data.
            </li>
            <li>
              <code>try_agent</code> - Send a test request through the AgentLink playground proxy.
            </li>
            <li>
              <code>get_agent_reviews</code> - Fetch review snapshots and rating summaries.
            </li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            3. MCP Request Example
          </h2>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
            <code>{requestExample}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}

