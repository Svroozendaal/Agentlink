import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const queryParams = parseQueryParams(req);
    const query = SearchAgentsQuerySchema.parse(queryParams);
    const result = await searchAgents(query);

    return NextResponse.json({ data: result.agents, meta: result.meta });
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
