import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { runRecruitmentPipeline } from "@/lib/recruitment/pipeline";
import { RecruitmentPipelineSchema } from "@/lib/validations/recruitment";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const input = RecruitmentPipelineSchema.parse(body);

    const data = await runRecruitmentPipeline(input);
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
