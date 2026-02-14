import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { registerAgentProfile } from "@/lib/services/agents";
import { RegisterAgentSchema } from "@/lib/validations/agent";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);

    if (!authContext || authContext.method !== "api-key") {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "API key authentication required",
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validatedBody = RegisterAgentSchema.parse(body);

    const createdAgent = await registerAgentProfile(validatedBody, authContext.user.id);

    return NextResponse.json(
      {
        data: {
          ...createdAgent,
          slug: createdAgent.slug,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid agent card format",
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
