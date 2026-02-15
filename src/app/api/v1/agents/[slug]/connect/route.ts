import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { executeConnectRequest } from "@/lib/services/connect";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";
import { ConnectRequestSchema } from "@/lib/validations/connect";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    if (authContext.method !== "api-key") {
      return NextResponse.json(
        {
          error: {
            code: "API_KEY_REQUIRED",
            message: "Connect requests require API key authentication",
          },
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = ConnectRequestSchema.parse(body);

    const result = await executeConnectRequest({
      fromAgentSlug: validatedBody.fromAgentSlug,
      toAgentSlug: validatedParams.slug,
      requestBody: validatedBody.body,
      userId: authContext.user.id,
      apiKeyId: authContext.apiKeyId ?? authContext.user.id,
      endpointId: validatedBody.endpointId,
    });

    const responseStatus =
      result.error && result.status === 504 ? 504 : result.error ? 502 : 200;

    return NextResponse.json({ data: result }, { status: responseStatus });
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

