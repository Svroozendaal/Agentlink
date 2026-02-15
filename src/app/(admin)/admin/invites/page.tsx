import type { Metadata } from "next";

import { listInvites } from "@/lib/services/invites";

import { InvitesClient } from "./invites-client";

export const metadata: Metadata = {
  title: "Admin Invites | AgentLink",
  description: "Create and track invite links for growth campaigns.",
};

export default async function AdminInvitesPage() {
  const result = await listInvites({
    page: 1,
    limit: 100,
  });

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Invites</h1>
        <p className="mt-2 text-zinc-600">
          Create single-use or campaign invites and monitor usage.
        </p>
      </header>

      <InvitesClient />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Recent invites</h2>
        <div className="mt-3 space-y-2">
          {result.data.length > 0 ? (
            result.data.map((invite) => (
              <article
                key={invite.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
              >
                <p className="font-medium text-zinc-800">{invite.token}</p>
                <p className="text-xs text-zinc-500">
                  Campaign: {invite.campaign} • Uses: {invite.usedCount}/{invite.maxUses}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No invites yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

