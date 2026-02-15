import type { Metadata } from "next";
import Link from "next/link";

import { listPendingAgentProfiles } from "@/lib/services/agents";

export const metadata: Metadata = {
  title: "Admin Moderation | AgentLink",
  description: "Review and approve submitted agent profiles before publication.",
};

export default async function AdminModerationPage() {
  const pendingAgents = await listPendingAgentProfiles(200);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Agent moderation</h1>
        <p className="mt-2 text-zinc-600">
          New agents from non-admin users require approval before they appear publicly.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Pending submissions</h2>
        <div className="mt-3 space-y-3">
          {pendingAgents.length > 0 ? (
            pendingAgents.map((agent) => (
              <article
                key={agent.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">{agent.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{agent.description}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Owner: {agent.owner.name ?? "Unknown"} ({agent.owner.email ?? "No email"})
                    </p>
                    <p className="text-xs text-zinc-500">
                      Created: {agent.createdAt.toISOString().slice(0, 10)} | Slug: {agent.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Preview
                    </Link>
                    <form action={`/api/v1/admin/agents/${agent.id}/approve`} method="post">
                      <button
                        type="submit"
                        className="rounded border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Approve and publish
                      </button>
                    </form>
                    <form action={`/api/v1/admin/agents/${agent.id}/reject`} method="post">
                      <input
                        type="text"
                        name="note"
                        placeholder="Optional rejection note"
                        className="mr-2 rounded border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No pending agent submissions.</p>
          )}
        </div>
      </section>
    </section>
  );
}

