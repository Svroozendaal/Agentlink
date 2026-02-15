import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { getConnectLog } from "@/lib/services/connect";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";
import { ConnectLogQuerySchema } from "@/lib/validations/connect";

export async function GET(
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

    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = ConnectLogQuerySchema.parse(queryParams);
    const result = await getConnectLog(validatedParams.slug, authContext.user.id, query);

    return NextResponse.json(result);
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
      {
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}

