import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { flagReviewById } from "@/lib/services/reviews";
import { FlagReviewSchema, ReviewIdParamsSchema } from "@/lib/validations/review";

export async function POST(
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
    const validatedParams = ReviewIdParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const validatedBody = FlagReviewSchema.parse(body);

    const result = await flagReviewById(validatedParams.id, authContext.user.id, validatedBody.reason);

    return NextResponse.json({
      data: {
        ...result,
        message: "Review flagged for moderation",
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
