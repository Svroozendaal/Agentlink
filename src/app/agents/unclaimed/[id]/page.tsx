import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

import { ClaimImportedAgent } from "./claim-imported-agent";

interface UnclaimedAgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: UnclaimedAgentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const importedAgent = await db.importedAgent.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!importedAgent) {
    return {
      title: "Unclaimed agent not found | AgentLink",
    };
  }

  return {
    title: `${importedAgent.name} (Unclaimed) | AgentLink`,
    description:
      importedAgent.description ??
      `Claim ${importedAgent.name} on AgentLink and unlock a full verified profile.`,
    alternates: {
      canonical: `/agents/unclaimed/${id}`,
    },
  };
}

export default async function UnclaimedAgentDetailPage({ params }: UnclaimedAgentDetailPageProps) {
  const { id } = await params;
  const importedAgent = await db.importedAgent.findUnique({
    where: { id },
  });

  if (!importedAgent) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/agents/unclaimed" className="text-sm text-sky-700 hover:text-sky-800">
          ← Back to unclaimed listings
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">{importedAgent.name}</h1>
        <p className="mt-2 text-zinc-600">
          {importedAgent.description ?? "No description available for this imported listing."}
        </p>

        <div className="mt-4 space-y-2 text-sm text-zinc-700">
          <p>
            Source platform: <strong>{importedAgent.sourcePlatform}</strong>
          </p>
          <p>
            Source URL:{" "}
            <a
              href={importedAgent.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 hover:underline"
            >
              {importedAgent.sourceUrl}
            </a>
          </p>
          <p>
            Status: <strong>{importedAgent.status}</strong>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p>
            This listing was imported from public data. If you own this agent, claim it to unlock a full
            profile with reviews, endorsements, and trust verification.
          </p>
        </div>

        <div className="mt-6">
          <ClaimImportedAgent importedAgentId={importedAgent.id} />
        </div>
      </section>
    </main>
  );
}

