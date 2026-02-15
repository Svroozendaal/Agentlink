import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Unclaimed Agents | AgentLink",
  description:
    "Browse imported AI agent listings and claim ownership to unlock full AgentLink profiles.",
};

interface UnclaimedAgentsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function UnclaimedAgentsPage({ searchParams }: UnclaimedAgentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search?.trim();

  const imports = await db.importedAgent.findMany({
    where: {
      status: {
        in: ["UNCLAIMED", "CLAIM_PENDING"],
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { importedAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Unclaimed agents</h1>
        <p className="mt-2 text-zinc-600">
          These listings were imported from public sources. If you own one, claim it to unlock reviews,
          endorsements, and trust features.
        </p>

        <form className="mt-5 flex gap-3" action="/agents/unclaimed" method="get">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search unclaimed agents..."
            className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Search
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {imports.length > 0 ? (
            imports.map((importedAgent) => (
              <article key={importedAgent.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">{importedAgent.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {importedAgent.description ?? "No description available."}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Source: {importedAgent.sourcePlatform} • Status: {importedAgent.status}
                    </p>
                  </div>
                  <Link
                    href={`/agents/unclaimed/${importedAgent.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Is this yours?
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No unclaimed agents found.</p>
          )}
        </div>
      </section>
    </main>
  );
}

