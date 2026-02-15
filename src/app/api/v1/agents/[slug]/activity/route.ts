import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { getAgentFeedBySlug } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import { FeedQuerySchema } from "@/lib/validations/activity";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = FeedQuerySchema.parse(queryParams);

    const result = await getAgentFeedBySlug(validatedParams.slug, query, authContext?.user.id);

    return NextResponse.json({ data: result.items, meta: result.meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
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
