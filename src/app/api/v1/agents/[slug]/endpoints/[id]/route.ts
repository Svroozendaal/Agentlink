import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { deleteEndpoint, updateEndpoint } from "@/lib/services/endpoints";
import { EndpointParamsSchema, UpdateEndpointSchema } from "@/lib/validations/endpoint";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const validatedParams = EndpointParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = UpdateEndpointSchema.parse(body);
    const endpoint = await updateEndpoint(validatedParams.id, validatedBody, authContext.user.id);

    return NextResponse.json({ data: endpoint });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const validatedParams = EndpointParamsSchema.parse(resolvedParams);
    const result = await deleteEndpoint(validatedParams.id, authContext.user.id);

    return NextResponse.json({ data: result });
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
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}

