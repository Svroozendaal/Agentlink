import type { Metadata } from "next";

import { getDiscoveryDashboard } from "@/lib/services/discovery";

export const metadata: Metadata = {
  title: "Admin Discovery | AgentLink",
  description: "Monitor agent-to-agent discovery loops and referral momentum.",
};

export default async function AdminDiscoveryPage() {
  const dashboard = await getDiscoveryDashboard();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Discovery Network</h1>
        <p className="mt-2 text-zinc-600">
          Track who discovers whom and how often discoveries convert to invocations.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Last 7 days</h2>
          <p className="mt-2 text-sm text-zinc-700">Discovery events: {dashboard.week.discovered}</p>
          <p className="mt-1 text-sm text-zinc-700">Invocation events: {dashboard.week.invoked}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Top queries</h2>
          <div className="mt-2 space-y-1 text-sm text-zinc-700">
            {dashboard.topQueries.length > 0 ? (
              dashboard.topQueries.slice(0, 5).map((row) => (
                <p key={row.query}>
                  {row.query} ({row.count})
                </p>
              ))
            ) : (
              <p>No query data yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Top discoverers</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {dashboard.topDiscoverers.length > 0 ? (
              dashboard.topDiscoverers.map((row) => (
                <p key={row.slug}>
                  {row.name} ({row.slug}) - {row.count}
                </p>
              ))
            ) : (
              <p>No discovery sources yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Top discovered agents</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {dashboard.topDiscovered.length > 0 ? (
              dashboard.topDiscovered.map((row) => (
                <p key={row.slug}>
                  {row.name} ({row.slug}) - discovered {row.discovered}, invoked {row.invoked}
                </p>
              ))
            ) : (
              <p>No discovery targets yet.</p>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
