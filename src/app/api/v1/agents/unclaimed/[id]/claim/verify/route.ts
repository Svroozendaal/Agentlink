import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { completeClaim } from "@/lib/services/claim";
import { AgentServiceError } from "@/lib/services/agents";

const ParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

const VerifySchema = z.object({
  challengeId: z.string().trim().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const validatedParams = ParamsSchema.parse(resolvedParams);
    const body = await req.json();
    VerifySchema.parse(body);

    const profile = await completeClaim(validatedParams.id, authContext.user.id);

    return NextResponse.json({
      data: {
        claimed: true,
        agentProfile: profile,
      },
    });
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

