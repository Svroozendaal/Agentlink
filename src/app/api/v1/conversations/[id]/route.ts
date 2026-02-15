import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { updateConversationStatus } from "@/lib/services/messaging";
import {
  ConversationIdParamsSchema,
  UpdateConversationSchema,
} from "@/lib/validations/messaging";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const validatedParams = ConversationIdParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = UpdateConversationSchema.parse(body);

    const conversation = await updateConversationStatus(
      validatedParams.id,
      authContext.user.id,
      validatedBody,
    );

    return NextResponse.json({ data: conversation });
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
