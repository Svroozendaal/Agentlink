import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError, approveAgentProfile } from "@/lib/services/agents";

const AgentIdParamsSchema = z.object({
  id: z.string().trim().min(10).max(64),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await requireAdmin(req);
    const resolvedParams = await params;
    const validatedParams = AgentIdParamsSchema.parse(resolvedParams);

    const updated = await approveAgentProfile(validatedParams.id, authContext.user.id);
    return NextResponse.json({ data: updated });
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

