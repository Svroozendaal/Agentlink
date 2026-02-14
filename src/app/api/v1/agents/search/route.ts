import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { searchAgents } from "@/lib/services/search";
import { SearchAgentsQuerySchema } from "@/lib/validations/agent";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
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
