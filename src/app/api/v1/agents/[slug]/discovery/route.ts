import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AgentServiceError } from "@/lib/services/agents";
import { getAgentDiscoveryInsights } from "@/lib/services/discovery";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const data = await getAgentDiscoveryInsights(validatedParams.slug);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid route params",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof AgentServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
