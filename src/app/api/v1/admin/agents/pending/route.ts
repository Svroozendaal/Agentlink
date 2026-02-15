import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError, listPendingAgentProfiles } from "@/lib/services/agents";

const PendingAgentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const query = PendingAgentsQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    const agents = await listPendingAgentProfiles(query.limit);

    return NextResponse.json({
      data: agents,
      meta: {
        total: agents.length,
        limit: query.limit,
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

    if (error instanceof AgentServiceError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
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

