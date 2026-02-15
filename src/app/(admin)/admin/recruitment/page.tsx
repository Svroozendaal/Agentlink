import type { Metadata } from "next";

import { getRecruitmentStatus } from "@/lib/recruitment/orchestrator";
import { listOptOutDomains } from "@/lib/recruitment/opt-out";
import { qualifyImportedAgents } from "@/lib/recruitment/pipeline";

import { RecruitmentClient } from "./recruitment-client";

export const metadata: Metadata = {
  title: "Admin Recruitment | AgentLink",
  description: "Automated recruitment pipeline command center.",
};

export default async function AdminRecruitmentPage() {
  const [status, optOutDomains, qualified] = await Promise.all([
    getRecruitmentStatus(),
    listOptOutDomains(),
    qualifyImportedAgents({ limit: 20, minScore: 1 }),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Recruitment command center</h1>
        <p className="mt-2 text-zinc-600">
          Discover, qualify, preview, and execute automated protocol-native invitations.
        </p>
      </header>

      <RecruitmentClient
        initialStatus={{
          ...status,
          recentResults: status.recentResults.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
          })),
          optOutDomains: optOutDomains.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
          })),
        }}
        initialQualified={qualified.qualified.map((entry) => ({
          id: entry.agent.id,
          name: entry.agent.name,
          sourcePlatform: entry.agent.sourcePlatform,
          sourceUrl: entry.agent.sourceUrl,
          score: entry.score,
          reasons: entry.reasons,
          strategies: entry.strategies.map((strategy) => ({
            method: strategy.method,
            url: strategy.url,
            priority: strategy.priority,
            description: strategy.description,
          })),
        }))}
      />
    </section>
  );
}
