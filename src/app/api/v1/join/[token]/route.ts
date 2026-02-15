import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { validateInviteToken } from "@/lib/services/invites";

const ParamsSchema = z.object({
  token: z.string().trim().min(4).max(120),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const resolvedParams = await params;
    const validatedParams = ParamsSchema.parse(resolvedParams);
    const invite = await validateInviteToken(validatedParams.token);

    if (!invite) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invite is invalid or expired" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        valid: true,
        campaign: invite.campaign,
        agentData: invite.agentData,
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
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

