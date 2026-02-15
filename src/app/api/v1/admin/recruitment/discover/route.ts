import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { runRecruitmentDiscover } from "@/lib/recruitment/pipeline";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = await runRecruitmentDiscover();
    return NextResponse.json({ data });
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
