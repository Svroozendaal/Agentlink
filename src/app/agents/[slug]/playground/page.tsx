import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getAgentBySlug } from "@/lib/services/agents";
import { listEndpoints } from "@/lib/services/endpoints";
import { db } from "@/lib/db";

import { PlaygroundClient } from "./playground-client";

interface PlaygroundPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlaygroundPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Agent Playground | ${slug} | AgentLink`,
    description: `Test ${slug} directly through the AgentLink playground proxy.`,
    alternates: {
      canonical: `/agents/${slug}/playground`,
    },
  };
}

export default async function AgentPlaygroundPage({ params }: PlaygroundPageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const viewerUserId = session?.user?.id;
  const [agent, endpointList] = await Promise.all([
    getAgentBySlug(slug, viewerUserId),
    listEndpoints(slug, viewerUserId),
  ]);

  if (!agent) {
    notFound();
  }

  if (!agent.playgroundEnabled) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Playground unavailable</h1>
          <p className="mt-2 text-zinc-600">
            This agent has not enabled playground access yet.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href={`/agents/${slug}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Back to profile
            </Link>
            {agent.documentationUrl ? (
              <a
                href={agent.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Open docs
              </a>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  const safeEndpoints = endpointList.map((endpoint) => {
    if ("authConfig" in endpoint) {
      const { authConfig: _authConfig, ...rest } = endpoint;
      return rest;
    }
    return endpoint;
  });

  const recentSessions = viewerUserId
    ? await db.playgroundSession.findMany({
        where: { agentId: agent.id, userId: viewerUserId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          requestBody: true,
          responseStatus: true,
          responseTimeMs: true,
          createdAt: true,
        },
      })
    : [];

  const serializableRecentSessions = recentSessions.map((session) => ({
    ...session,
    createdAt: session.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <PlaygroundClient
        slug={slug}
        agentName={agent.name}
        documentationUrl={agent.documentationUrl}
        endpoints={safeEndpoints}
        recentSessions={serializableRecentSessions}
      />
    </main>
  );
}
