import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { revokeApiKey } from "@/lib/auth/api-keys";
import { getAuthContext } from "@/lib/auth/get-auth-context";

const IdParamsSchema = z.object({
  id: z.string().cuid(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext || authContext.method !== "session") {
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
    const validatedParams = IdParamsSchema.parse(resolvedParams);

    const revoked = await revokeApiKey(validatedParams.id, authContext.user.id);

    if (!revoked) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "API key not found",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: validatedParams.id,
        revoked: true,
      },
    });
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
