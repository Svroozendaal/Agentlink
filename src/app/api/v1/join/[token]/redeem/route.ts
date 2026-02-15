import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { redeemInvite } from "@/lib/services/invites";

const ParamsSchema = z.object({
  token: z.string().trim().min(4).max(120),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
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
    const validatedParams = ParamsSchema.parse(resolvedParams);
    const redeemed = await redeemInvite(validatedParams.token, authContext.user.id);

    return NextResponse.json({
      data: {
        invite: {
          token: redeemed.invite.token,
          campaign: redeemed.invite.campaign,
          agentName: redeemed.invite.agentName,
        },
        preFillData: redeemed.preFillData,
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
    if (error instanceof AgentServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

