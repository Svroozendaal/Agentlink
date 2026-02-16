import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { executeQueuedOutreach } from "@/lib/services/outreach";
import { ExecuteOutreachSchema } from "@/lib/validations/outreach";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const input = ExecuteOutreachSchema.parse(body);

    const data = await executeQueuedOutreach({
      campaign: input.campaign,
      platform: input.platform,
      limit: input.limit,
      dryRun: input.dryRun ?? false,
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
