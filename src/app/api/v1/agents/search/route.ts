import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackDiscoverySearch } from "@/lib/services/discovery";
import { searchAgents } from "@/lib/services/search";
import { SearchAgentsQuerySchema } from "@/lib/validations/agent";

function parseQueryParams(req: NextRequest): Record<string, string> {
  const csvKeys = new Set(["skills", "tags", "protocols", "endpointTypes"]);
  const parsed: Record<string, string> = {};

  for (const key of req.nextUrl.searchParams.keys()) {
    const values = req.nextUrl.searchParams.getAll(key).filter(Boolean);
    if (values.length === 0) {
      continue;
    }

    parsed[key] = csvKeys.has(key) ? values.join(",") : values[0];
  }

  if (!parsed.discovererSlug && parsed.discoverer) {
    parsed.discovererSlug = parsed.discoverer;
  }

  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const queryParams = parseQueryParams(req);
    const query = SearchAgentsQuerySchema.parse(queryParams);
    const result = await searchAgents(query);

    if (query.discovererSlug && result.agents.length > 0) {
      await trackDiscoverySearch({
        discovererSlug: query.discovererSlug,
        discoveredSlugs: result.agents.map((agent) => agent.slug),
        searchQuery: query.q,
        source: "api-search",
      });
    }

    return NextResponse.json({
      data: result.agents,
      meta: {
        ...result.meta,
        powered_by: "AgentLink Discovery API",
        add_your_agent: "https://www.agent-l.ink/register",
        api_docs: "https://www.agent-l.ink/docs",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
