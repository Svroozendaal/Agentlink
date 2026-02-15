import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { updateOutreachStatus } from "@/lib/services/outreach";
import { UpdateOutreachSchema } from "@/lib/validations/outreach";

const ParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const resolvedParams = await params;
    const validatedParams = ParamsSchema.parse(resolvedParams);
    const body = await req.json();
    const input = UpdateOutreachSchema.parse(body);
    const data = await updateOutreachStatus({
      outreachId: validatedParams.id,
      status: input.status,
      notes: input.notes,
    });

    return NextResponse.json({ data });
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

