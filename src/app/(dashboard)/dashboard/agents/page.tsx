import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listOwnedAgents } from "@/lib/services/agents";

import { AgentDeleteButton } from "./agent-delete-button";

function getStatusLabel(input: { isPublished: boolean; moderationStatus: string }) {
  if (input.isPublished) {
    return "Published";
  }

  if (input.moderationStatus === "PENDING") {
    return "Pending approval";
  }

  if (input.moderationStatus === "REJECTED") {
    return "Rejected";
  }

  return "Draft";
}

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
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">My agents</h1>
          <p className="mt-1 text-zinc-600">Manage your agent profiles and publication status.</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          New agent
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
                  Status: {getStatusLabel(agent)}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Rating:{" "}
                  {agent.reviewCount > 0 ? `${agent.averageRating.toFixed(1)} / 5` : "No reviews yet"}{" "}
                  ({agent.reviewCount} reviews)
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Endorsements: {agent.endorsementCount} - Messaging:{" "}
                  {agent.acceptsMessages ? "On" : "Off"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/agents/${agent.slug}`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
                >
                  View
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
              You have not created any agents yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
