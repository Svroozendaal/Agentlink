import { db } from "@/lib/db";

export interface FeaturedAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  score: number;
}

export async function getFeaturedAgentsByScore(limit = 6): Promise<FeaturedAgent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 24));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);

  const [agents, recentActivity] = await Promise.all([
    db.agentProfile.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        reviewCount: true,
        averageRating: true,
        endorsementCount: true,
        playgroundEnabled: true,
        isEarlyAdopter: true,
        connectEnabled: true,
      },
    }),
    db.activityEvent.groupBy({
      by: ["targetAgentId"],
      where: {
        targetAgentId: { not: null },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
    }),
  ]);

  const activitySet = new Set(
    recentActivity
      .map((row) => row.targetAgentId)
      .filter((value): value is string => typeof value === "string"),
  );

  return agents
    .map((agent) => {
      const score =
        agent.reviewCount * 2 +
        agent.averageRating * 10 +
        agent.endorsementCount * 1 +
        (agent.isEarlyAdopter ? 20 : 0) +
        (agent.playgroundEnabled ? 15 : 0) +
        (agent.connectEnabled ? 5 : 0) +
        (activitySet.has(agent.id) ? 10 : 0);

      return {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);
}

