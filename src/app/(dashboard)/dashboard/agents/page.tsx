import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listOwnedAgents } from "@/lib/services/agents";

import { AgentDeleteButton } from "./agent-delete-button";

export default async function DashboardAgentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const agents = await listOwnedAgents(session.user.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Mijn agents</h1>
          <p className="mt-1 text-zinc-600">Beheer hier je agentprofielen en publicatiestatus.</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Nieuwe agent
        </Link>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <ul className="divide-y divide-zinc-200">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{agent.name}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Status: {agent.isPublished ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/agents/${agent.slug}`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
                >
                  Bekijk
                </Link>
                <Link
                  href={`/dashboard/agents/${agent.slug}/edit`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
                >
                  Edit
                </Link>
                <AgentDeleteButton slug={agent.slug} />
              </div>
            </li>
          ))}
          {agents.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-zinc-600">
              Je hebt nog geen agents aangemaakt.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
