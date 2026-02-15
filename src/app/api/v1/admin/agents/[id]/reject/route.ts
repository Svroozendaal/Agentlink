import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError, rejectAgentProfile } from "@/lib/services/agents";

const AgentIdParamsSchema = z.object({
  id: z.string().trim().min(10).max(64),
});

async function readRejectNote(req: NextRequest): Promise<string | undefined> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (body && typeof body.note === "string") {
      return body.note;
    }
    return undefined;
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await req.formData().catch(() => null);
    const note = formData?.get("note");
    if (typeof note === "string") {
      return note;
    }
  }

  return undefined;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await requireAdmin(req);
    const resolvedParams = await params;
    const validatedParams = AgentIdParamsSchema.parse(resolvedParams);
    const note = await readRejectNote(req);

    const updated = await rejectAgentProfile(validatedParams.id, authContext.user.id, note);
    return NextResponse.json({ data: updated });
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
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
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

