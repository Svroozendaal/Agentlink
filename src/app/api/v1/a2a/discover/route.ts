import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const requestedLimit = limitParam ? Number(limitParam) : 20;
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, 50))
    : 20;

  const agents = await db.agentProfile.findMany({
    where: {
      isPublished: true,
    },
    select: {
      slug: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: safeLimit,
  });

  const profiles = await db.agentProfile.findMany({
    where: {
      slug: {
        in: agents.map((agent) => agent.slug),
      },
    },
    select: {
      slug: true,
      name: true,
      description: true,
      skills: true,
      endpointUrl: true,
    },
  });

  const baseUrl = getBaseUrl();

  return NextResponse.json({
    agents: profiles.map((profile) => ({
      name: profile.name,
      description: profile.description,
      url: `${baseUrl}/agents/${profile.slug}`,
      endpoint: profile.endpointUrl,
      skills: profile.skills,
      authentication: {
        type: "apiKey",
      },
    })),
  });
}


