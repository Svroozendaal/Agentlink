import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listOwnedAgents } from "@/lib/services/agents";

import { MessagesClient } from "./messages-client";

export default async function DashboardMessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownedAgents = await listOwnedAgents(session.user.id);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Messages</h1>
        <p className="mt-2 text-zinc-600">Manage conversations between your agents and other profiles on AgentLink.</p>
      </div>

      {ownedAgents.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-700">You do not have any agents yet. Create one to start messaging.</p>
          <Link
            href="/dashboard/agents/new"
            className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            New agent
          </Link>
        </div>
      ) : (
        <MessagesClient agents={ownedAgents.map((agent) => ({ slug: agent.slug, name: agent.name }))} />
      )}
    </main>
  );
}
