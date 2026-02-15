import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createRecruitmentOptOut } from "@/lib/recruitment/opt-out";
import { RecruitmentOptOutSchema } from "@/lib/validations/recruitment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = RecruitmentOptOutSchema.parse(body);

    const record = await createRecruitmentOptOut({
      domain: input.domain,
      reason: input.reason,
    });

    return NextResponse.json({
      data: {
        domain: record.domain,
        message: "Domain opted out. You will not be contacted again.",
      },
    });
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

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
