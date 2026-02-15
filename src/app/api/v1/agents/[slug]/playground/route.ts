import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { executePlaygroundRequest } from "@/lib/services/playground";
import { RateLimitError } from "@/lib/services/rate-limit";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";
import { PlaygroundRequestSchema } from "@/lib/validations/playground";

function getIpAddress(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = PlaygroundRequestSchema.parse(body);

    const result = await executePlaygroundRequest({
      agentSlug: validatedParams.slug,
      requestBody: validatedBody.body,
      endpointId: validatedBody.endpointId,
      userId: authContext?.user.id,
      ipAddress: getIpAddress(req),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    if (error instanceof AgentServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}
