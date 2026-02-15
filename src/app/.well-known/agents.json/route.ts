import { NextResponse } from "next/server";

import { db } from "@/lib/db";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export async function GET() {
  const baseUrl = getBaseUrl();
  const [totalAgents, agentsWithPlayground, agentsWithConnect] = await Promise.all([
    db.agentProfile.count({
      where: { isPublished: true },
    }),
    db.agentProfile.count({
      where: { isPublished: true, playgroundEnabled: true },
    }),
    db.agentProfile.count({
      where: { isPublished: true, connectEnabled: true },
    }),
  ]);

  return NextResponse.json({
    registry: "agentlink",
    total_agents: totalAgents,
    agents_with_playground: agentsWithPlayground,
    agents_with_connect: agentsWithConnect,
    search_endpoint: `${baseUrl}/api/v1/agents/search`,
    register_endpoint: `${baseUrl}/api/v1/agents/register`,
    playground_endpoint: `${baseUrl}/api/v1/agents/{slug}/playground`,
    connect_endpoint: `${baseUrl}/api/v1/agents/{slug}/connect`,
    mcp_endpoint: `${baseUrl}/api/v1/mcp`,
    documentation: `${baseUrl}/docs`,
    feed_endpoint: `${baseUrl}/api/v1/feed`,
  });
}
