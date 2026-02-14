import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
  AgentServiceError,
  getAgentBySlug,
  unpublishAgentBySlug,
  updateAgentBySlug,
} from "@/lib/services/agents";
import { AgentSlugParamsSchema, UpdateAgentSchema } from "@/lib/validations/agent";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const authContext = await getAuthContext(req);

    const agent = await getAgentBySlug(validatedParams.slug, authContext?.user.id);

    if (!agent) {
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

    return NextResponse.json({ data: agent });
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);

    if (!authContext) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = UpdateAgentSchema.parse(body);
    const updatedAgent = await updateAgentBySlug(
      validatedParams.slug,
      authContext.user.id,
      validatedBody,
    );

    return NextResponse.json({ data: updatedAgent });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const authContext = await getAuthContext(req);

    if (!authContext) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const validatedParams = AgentSlugParamsSchema.parse(resolvedParams);
    const unpublishedAgent = await unpublishAgentBySlug(
      validatedParams.slug,
      authContext.user.id,
    );

    return NextResponse.json({ data: unpublishedAgent });
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
