import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { getRecruitmentStatus } from "@/lib/recruitment/orchestrator";
import { listOptOutDomains } from "@/lib/recruitment/opt-out";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [status, optOutDomains] = await Promise.all([
      getRecruitmentStatus(),
      listOptOutDomains(),
    ]);

    return NextResponse.json({
      data: {
        ...status,
        optOutDomains,
      },
    });
  } catch (error) {
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
