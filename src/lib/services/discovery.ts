import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { triggerAgentWebhooks } from "@/lib/services/webhooks";

interface DiscoverySearchTrackInput {
  discovererSlug?: string;
  discoveredSlugs: string[];
  searchQuery?: string;
  source?: string;
}

interface DiscoveryInvocationTrackInput {
  discovererSlug: string;
  discoveredSlug: string;
  invocationMethod?: string;
  searchQuery?: string;
  source?: string;
}

interface TopCategoryRow {
  category: string;
  count: number;
}

interface TopQueryRow {
  query: string;
  count: number;
}

interface CountRow {
  count: number;
}

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
}

function referralTier(referrals: number) {
  if (referrals >= 50) {
    return "Advocate Elite";
  }
  if (referrals >= 20) {
    return "Advocate Pro";
  }
  if (referrals >= 5) {
    return "Advocate Starter";
  }
  return "Community";
}

async function resolveDiscovererBySlug(slug: string) {
  return db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
    },
  });
}

export async function trackDiscoverySearch(input: DiscoverySearchTrackInput) {
  if (!input.discovererSlug || input.discoveredSlugs.length === 0) {
    return { tracked: 0 };
  }

  const [discoverer, discoveredAgents] = await Promise.all([
    resolveDiscovererBySlug(input.discovererSlug),
    db.agentProfile.findMany({
      where: {
        slug: {
          in: input.discoveredSlugs.slice(0, 20),
        },
      },
      select: {
        id: true,
        slug: true,
      },
    }),
  ]);

  if (!discoverer || discoveredAgents.length === 0) {
    return { tracked: 0 };
  }

  try {
    await db.discoveryEvent.createMany({
      data: discoveredAgents.map((agent) => ({
        discovererAgentId: discoverer.id,
        discoveredAgentId: agent.id,
        searchQuery: input.searchQuery?.slice(0, 300) || null,
        resultedInInvocation: false,
        invocationMethod: null,
        source: input.source ?? "api",
      })),
    });
  } catch {
    return { tracked: 0 };
  }

  await Promise.all(
    discoveredAgents.slice(0, 5).map(async (agent) => {
      try {
        await triggerAgentWebhooks(agent.id, "agent.discovered", {
          discoveredAgent: agent.slug,
          discoverer: discoverer.slug,
          discovererName: discoverer.name,
          query: input.searchQuery ?? "",
          source: input.source ?? "api",
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Webhook delivery errors should not fail search requests.
      }
    }),
  );

  return { tracked: discoveredAgents.length };
}

export async function trackDiscoveryInvocation(input: DiscoveryInvocationTrackInput) {
  const [discoverer, discovered] = await Promise.all([
    resolveDiscovererBySlug(input.discovererSlug),
    db.agentProfile.findUnique({
      where: { slug: input.discoveredSlug },
      select: { id: true, slug: true },
    }),
  ]);

  if (!discoverer || !discovered) {
    return { tracked: false };
  }

  try {
    await db.discoveryEvent.create({
      data: {
        discovererAgentId: discoverer.id,
        discoveredAgentId: discovered.id,
        searchQuery: input.searchQuery?.slice(0, 300) || null,
        resultedInInvocation: true,
        invocationMethod: input.invocationMethod?.slice(0, 120) || "connect",
        source: input.source ?? "connect-api",
      },
    });
  } catch {
    return { tracked: false };
  }

  try {
    await triggerAgentWebhooks(discovered.id, "agent.discovered", {
      discoveredAgent: discovered.slug,
      discoverer: discoverer.slug,
      discovererName: discoverer.name,
      query: input.searchQuery ?? "",
      source: input.source ?? "connect-api",
      invocationMethod: input.invocationMethod ?? "connect",
      resultedInInvocation: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Ignore webhook delivery failures.
  }

  return { tracked: true };
}

export async function getAgentDiscoveryInsights(slug: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  const since7Days = dateDaysAgo(7);

  try {
    const [discoveredThisWeek, invokedThisWeek, topSourceRows, topQueryRows, referralRows] =
      await Promise.all([
        db.discoveryEvent.count({
          where: {
            discoveredAgentId: agent.id,
            createdAt: { gte: since7Days },
          },
        }),
        db.discoveryEvent.count({
          where: {
            discoveredAgentId: agent.id,
            resultedInInvocation: true,
            createdAt: { gte: since7Days },
          },
        }),
        db.$queryRaw<TopCategoryRow[]>(Prisma.sql`
        SELECT
          COALESCE(src.category, 'unknown') AS "category",
          COUNT(*)::int AS "count"
        FROM discovery_events d
        LEFT JOIN agent_profiles src ON src.id = d.discoverer_agent_id
        WHERE d.discovered_agent_id = ${agent.id}
          AND d.created_at >= ${since7Days}
        GROUP BY COALESCE(src.category, 'unknown')
        ORDER BY COUNT(*) DESC
        LIMIT 3
        `),
        db.$queryRaw<TopQueryRow[]>(Prisma.sql`
        SELECT
          d.search_query AS "query",
          COUNT(*)::int AS "count"
        FROM discovery_events d
        WHERE d.discovered_agent_id = ${agent.id}
          AND d.search_query IS NOT NULL
          AND d.created_at >= ${since7Days}
        GROUP BY d.search_query
        ORDER BY COUNT(*) DESC
        LIMIT 5
        `),
        db.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(DISTINCT d.discovered_agent_id)::int AS "count"
        FROM discovery_events d
        WHERE d.discoverer_agent_id = ${agent.id}
          AND d.resulted_in_invocation = true
        `),
      ]);

    const referrals = referralRows[0]?.count ?? 0;

    return {
      agent: {
        slug: agent.slug,
        name: agent.name,
      },
      discoveredThisWeek,
      invokedThisWeek,
      topDiscoverySource: topSourceRows[0]?.category ?? "unknown",
      topSearchQueries: topQueryRows,
      referral: {
        successfulReferrals: referrals,
        tier: referralTier(referrals),
      },
    };
  } catch {
    return {
      agent: {
        slug: agent.slug,
        name: agent.name,
      },
      discoveredThisWeek: 0,
      invokedThisWeek: 0,
      topDiscoverySource: "unknown",
      topSearchQueries: [],
      referral: {
        successfulReferrals: 0,
        tier: referralTier(0),
      },
    };
  }
}

export async function getDiscoveryDashboard() {
  const since7Days = dateDaysAgo(7);

  try {
    const [totals, topDiscoverers, topDiscovered, topQueries] = await Promise.all([
      db.$queryRaw<{ discovered: number; invoked: number }[]>(Prisma.sql`
      SELECT
        COUNT(*)::int AS "discovered",
        COUNT(*) FILTER (WHERE resulted_in_invocation = true)::int AS "invoked"
      FROM discovery_events
      WHERE created_at >= ${since7Days}
      `),
      db.$queryRaw<Array<{ slug: string; name: string; count: number }>>(Prisma.sql`
      SELECT
        a.slug AS "slug",
        a.name AS "name",
        COUNT(*)::int AS "count"
      FROM discovery_events d
      INNER JOIN agent_profiles a ON a.id = d.discoverer_agent_id
      WHERE d.created_at >= ${since7Days}
      GROUP BY a.slug, a.name
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `),
      db.$queryRaw<Array<{ slug: string; name: string; discovered: number; invoked: number }>>(Prisma.sql`
      SELECT
        a.slug AS "slug",
        a.name AS "name",
        COUNT(*)::int AS "discovered",
        COUNT(*) FILTER (WHERE d.resulted_in_invocation = true)::int AS "invoked"
      FROM discovery_events d
      INNER JOIN agent_profiles a ON a.id = d.discovered_agent_id
      WHERE d.created_at >= ${since7Days}
      GROUP BY a.slug, a.name
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `),
      db.$queryRaw<Array<{ query: string; count: number }>>(Prisma.sql`
      SELECT
        search_query AS "query",
        COUNT(*)::int AS "count"
      FROM discovery_events
      WHERE created_at >= ${since7Days}
        AND search_query IS NOT NULL
      GROUP BY search_query
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `),
    ]);

    return {
      week: {
        discovered: totals[0]?.discovered ?? 0,
        invoked: totals[0]?.invoked ?? 0,
      },
      topDiscoverers,
      topDiscovered,
      topQueries,
    };
  } catch {
    return {
      week: {
        discovered: 0,
        invoked: 0,
      },
      topDiscoverers: [],
      topDiscovered: [],
      topQueries: [],
    };
  }
}
