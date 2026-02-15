import type { Metadata } from "next";

import { db } from "@/lib/db";
import { listOutreachRecords } from "@/lib/services/outreach";

import { OutreachClient } from "./outreach-client";

export const metadata: Metadata = {
  title: "Admin Outreach | AgentLink",
  description: "Generate and track outreach campaigns for imported agents.",
};

export default async function AdminOutreachPage() {
  const [records, campaignStats] = await Promise.all([
    listOutreachRecords({ page: 1, limit: 100 }),
    db.outreachRecord.groupBy({
      by: ["campaign", "status"],
      where: { campaign: { not: null } },
      _count: { _all: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Outreach</h1>
        <p className="mt-2 text-zinc-600">
          Build a daily outreach pipeline from imported listings and track conversion.
        </p>
      </header>

      <OutreachClient />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Pipeline</h2>
        <div className="mt-3 space-y-2">
          {records.data.length > 0 ? (
            records.data.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              >
                <p className="font-medium text-zinc-800">{record.targetName}</p>
                <p className="text-xs text-zinc-500">
                  {record.platform} • {record.status} • {record.campaign ?? "no-campaign"}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No outreach records yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Campaign breakdown</h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-700">
          {campaignStats.length > 0 ? (
            campaignStats.map((row) => (
              <p key={`${row.campaign}-${row.status}`}>
                {row.campaign}: {row.status} ({row._count._all})
              </p>
            ))
          ) : (
            <p>No campaign stats yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

