import type { Metadata } from "next";

import { db } from "@/lib/db";
import { getImportStats } from "@/lib/services/import";

import { ImportsClient } from "./imports-client";

export const metadata: Metadata = {
  title: "Admin Imports | AgentLink",
  description: "Manage imported agent listings and claim queues.",
};

export default async function AdminImportsPage() {
  const [stats, imports] = await Promise.all([
    getImportStats(),
    db.importedAgent.findMany({
      orderBy: { importedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Import management</h1>
        <p className="mt-2 text-zinc-600">
          Trigger imports, review source quality, and approve or reject listings.
        </p>
      </header>

      <ImportsClient initialStats={stats} />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Latest imports</h2>
        <div className="mt-3 space-y-2">
          {imports.length > 0 ? (
            imports.map((importedAgent) => (
              <article
                key={importedAgent.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-800">{importedAgent.name}</p>
                  <p className="text-xs text-zinc-500">
                    {importedAgent.sourcePlatform} • {importedAgent.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={`/api/v1/admin/import/${importedAgent.id}/approve-claim`} method="post">
                    <button
                      type="submit"
                      className="rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Approve claim
                    </button>
                  </form>
                  <form action={`/api/v1/admin/import/${importedAgent.id}/reject`} method="post">
                    <button
                      type="submit"
                      className="rounded border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No imported agents yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
