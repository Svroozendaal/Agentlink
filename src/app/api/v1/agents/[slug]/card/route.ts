import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { buildAgentCardBySlug } from "@/lib/services/agent-card";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);

    const card = await buildAgentCardBySlug(validatedParams.slug, {
      viewerUserId: authContext?.user.id,
    });

    if (!card) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Agent not found",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: card });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid route parameters",
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
