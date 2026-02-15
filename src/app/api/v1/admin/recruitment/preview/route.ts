import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { previewRecruitmentMessages } from "@/lib/recruitment/pipeline";
import { RecruitmentPreviewSchema } from "@/lib/validations/recruitment";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin(req);
    const body = await req.json();
    const input = RecruitmentPreviewSchema.parse(body);

    const data = await previewRecruitmentMessages({
      agentIds: input.agentIds,
      campaign: input.campaign,
      adminUserId: authContext.user.id,
    });

    return NextResponse.json({ data });
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
