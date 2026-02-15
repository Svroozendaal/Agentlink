import type { Metadata } from "next";

import { getGrowthDashboard } from "@/lib/services/metrics";

export const metadata: Metadata = {
  title: "Admin Growth Dashboard | AgentLink",
  description: "Track AgentLink growth funnel, sources, and campaign performance.",
};

export default async function AdminGrowthPage() {
  const data = await getGrowthDashboard();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Growth dashboard</h1>
        <p className="mt-2 text-zinc-600">Acquisition funnel, source mix, and campaign outcomes.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total agents</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{data.today?.totalAgents ?? 0}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">New agents today</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{data.today?.newAgents ?? 0}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total users</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{data.today?.totalUsers ?? 0}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Conversion rate</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{data.funnel.conversionRate}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Acquisition funnel</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>Imported: {data.funnel.imported}</li>
            <li>Outreach sent: {data.funnel.outreachSent}</li>
            <li>Invites used: {data.funnel.invitesUsed}</li>
            <li>Registered: {data.funnel.registered}</li>
          </ul>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Top sources</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {data.topSources.length > 0 ? (
              data.topSources.map((source) => (
                <p key={source.source}>
                  {source.source}: <strong>{source.agents}</strong>
                </p>
              ))
            ) : (
              <p>No source data yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Top campaigns</h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-700">
          {data.topCampaigns.length > 0 ? (
            data.topCampaigns.map((campaign) => (
              <p key={campaign.campaign}>
                {campaign.campaign}: {campaign.registered}/{campaign.sent} registered ({campaign.rate})
              </p>
            ))
          ) : (
            <p>No campaign data yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

