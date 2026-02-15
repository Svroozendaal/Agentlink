import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { addEndpoint, listEndpoints } from "@/lib/services/endpoints";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";
import { AddEndpointSchema } from "@/lib/validations/endpoint";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const authContext = await getAuthContext(req);
    const endpoints = await listEndpoints(validatedParams.slug, authContext?.user.id);

    return NextResponse.json({ data: endpoints });
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
          error: { code: error.code, message: error.message },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = AddEndpointSchema.parse(body);
    const endpoint = await addEndpoint(validatedParams.slug, validatedBody, authContext.user.id);

    return NextResponse.json({ data: endpoint }, { status: 201 });
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

    if (error instanceof AgentServiceError) {
      return NextResponse.json(
        {
          error: { code: error.code, message: error.message },
        },
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

