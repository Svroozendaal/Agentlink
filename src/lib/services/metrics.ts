import { db } from "@/lib/db";

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function dateNDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
}

export async function recordDailyMetrics() {
  const today = startOfDay();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const [
    totalAgents,
    newAgents,
    totalUsers,
    newUsers,
    totalReviews,
    importedAgents,
    claimedAgents,
    invitesSent,
    invitesUsed,
    apiRegistrations,
  ] = await Promise.all([
    db.agentProfile.count(),
    db.agentProfile.count({
      where: { createdAt: { gte: today } },
    }),
    db.user.count(),
    db.user.count({
      where: { createdAt: { gte: today } },
    }),
    db.review.count(),
    db.importedAgent.count(),
    db.importedAgent.count({
      where: { status: "CLAIMED" },
    }),
    db.inviteToken.count(),
    db.inviteToken.aggregate({
      _sum: { usedCount: true },
    }),
    db.activityEvent.count({
      where: { type: "AGENT_REGISTERED_VIA_API" },
    }),
  ]);

  const metric = await db.growthMetric.upsert({
    where: { date: today },
    update: {
      totalAgents,
      newAgents,
      totalUsers,
      newUsers,
      totalReviews,
      importedAgents,
      claimedAgents,
      invitesSent,
      invitesUsed: invitesUsed._sum.usedCount ?? 0,
      apiRegistrations,
    },
    create: {
      date: today,
      totalAgents,
      newAgents,
      totalUsers,
      newUsers,
      totalReviews,
      importedAgents,
      claimedAgents,
      invitesSent,
      invitesUsed: invitesUsed._sum.usedCount ?? 0,
      apiRegistrations,
    },
  });

  const previous = await db.growthMetric.findUnique({
    where: { date: yesterday },
  });

  return {
    metric,
    delta: {
      agents: previous ? metric.totalAgents - previous.totalAgents : metric.newAgents,
      users: previous ? metric.totalUsers - previous.totalUsers : metric.newUsers,
      reviews: previous ? metric.totalReviews - previous.totalReviews : 0,
    },
  };
}

async function get7DaySeries(field: "newAgents" | "newUsers" | "totalReviews") {
  const since = dateNDaysAgo(7);
  const rows = await db.growthMetric.findMany({
    where: { date: { gte: startOfDay(since) } },
    orderBy: { date: "asc" },
  });

  return rows.map((row) => {
    if (field === "newAgents") return row.newAgents;
    if (field === "newUsers") return row.newUsers;
    if (field === "totalReviews") return row.totalReviews;
    return 0;
  });
}

export async function getGrowthDashboard() {
  const today = startOfDay();
  const latestMetric = await db.growthMetric.findUnique({
    where: { date: today },
  });

  const [agents7d, users7d, reviews7d, outreachSent, invitesUsedAgg, registered, topSources, topCampaigns] =
    await Promise.all([
      get7DaySeries("newAgents"),
      get7DaySeries("newUsers"),
      get7DaySeries("totalReviews"),
      db.outreachRecord.count({
        where: { status: { in: ["SENT", "RESPONDED", "REGISTERED"] } },
      }),
      db.inviteToken.aggregate({ _sum: { usedCount: true } }),
      db.agentProfile.count(),
      db.importedAgent.groupBy({
        by: ["sourcePlatform"],
        _count: { _all: true },
        orderBy: { _count: { sourcePlatform: "desc" } },
        take: 5,
      }),
      db.outreachRecord.groupBy({
        by: ["campaign"],
        where: { campaign: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { campaign: "desc" } },
        take: 5,
      }),
    ]);

  const imported = await db.importedAgent.count();
  const invitesUsed = invitesUsedAgg._sum.usedCount ?? 0;
  const conversionRate = outreachSent > 0 ? `${((registered / outreachSent) * 100).toFixed(1)}%` : "0%";

  const topCampaignRows = await Promise.all(
    topCampaigns
      .filter((row) => row.campaign)
      .map(async (row) => {
        const registeredCount = await db.outreachRecord.count({
          where: { campaign: row.campaign, status: "REGISTERED" },
        });
        return {
          campaign: row.campaign as string,
          sent: row._count._all,
          registered: registeredCount,
          rate: row._count._all > 0 ? `${((registeredCount / row._count._all) * 100).toFixed(1)}%` : "0%",
        };
      }),
  );

  return {
    today: latestMetric
      ? {
          totalAgents: latestMetric.totalAgents,
          newAgents: latestMetric.newAgents,
          totalUsers: latestMetric.totalUsers,
          newUsers: latestMetric.newUsers,
          totalReviews: latestMetric.totalReviews,
          importedAgents: latestMetric.importedAgents,
          claimedAgents: latestMetric.claimedAgents,
          invitesSent: latestMetric.invitesSent,
          invitesUsed: latestMetric.invitesUsed,
          apiRegistrations: latestMetric.apiRegistrations,
        }
      : null,
    growth: {
      agents7d,
      users7d,
      reviews7d,
    },
    funnel: {
      imported,
      outreachSent,
      invitesUsed,
      registered,
      conversionRate,
    },
    topSources: topSources.map((entry) => ({
      source: entry.sourcePlatform,
      agents: entry._count._all,
    })),
    topCampaigns: topCampaignRows,
  };
}
