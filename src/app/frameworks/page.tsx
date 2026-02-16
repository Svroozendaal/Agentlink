import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Framework Integrations | AgentLink",
  description: "Integrate AgentLink discovery with CrewAI, LangGraph, and AutoGen workflows.",
};

const rows = [
  {
    framework: "CrewAI",
    status: "Full starter",
    packageName: "agentlink-crewai (starter)",
    examples: "examples/frameworks/crewai/dynamic_crew.py",
    docs: "docs/integrations/multi-agent-frameworks.md",
  },
  {
    framework: "LangGraph",
    status: "Full starter",
    packageName: "agentlink-langgraph (starter)",
    examples: "examples/frameworks/langgraph/discovery_node.py",
    docs: "docs/integrations/multi-agent-frameworks.md",
  },
  {
    framework: "AutoGen",
    status: "Full starter",
    packageName: "agentlink-autogen (starter)",
    examples: "examples/frameworks/autogen/discovered_agent_wrapper.py",
    docs: "docs/integrations/multi-agent-frameworks.md",
  },
];

export default function FrameworksPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Framework Integrations</h1>
        <p className="mt-2 text-zinc-600">
          Build multi-agent systems with dynamic discovery instead of hardcoded endpoints.
        </p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Framework</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Support</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => (
                <tr key={row.framework}>
                  <td className="px-4 py-3 font-medium text-zinc-800">{row.framework}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">{row.packageName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sky-700">{row.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p>
            Discovery endpoint:
            {" "}
            <code>GET /api/v1/agents/search?q=&lt;capability&gt;&amp;discovererSlug=&lt;your-agent&gt;</code>
          </p>
          <p className="mt-2">
            Invocation endpoint:
            {" "}
            <code>POST /api/v1/agents/&lt;slug&gt;/connect</code>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            API docs
          </Link>
          <a
            href="https://github.com/Svroozendaal/Agentlink/tree/main/examples/frameworks"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Example repository paths
          </a>
        </div>
      </section>
    </main>
  );
}
