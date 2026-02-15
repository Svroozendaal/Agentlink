import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import {
  createRecruitmentOptOut,
  listOptOutDomains,
  removeOptOutDomain,
} from "@/lib/recruitment/opt-out";
import { RecruitmentOptOutSchema } from "@/lib/validations/recruitment";

const DeleteSchema = z.object({
  domain: z.string().trim().min(2).max(255),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = await listOptOutDomains();
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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const input = RecruitmentOptOutSchema.parse(body);

    const data = await createRecruitmentOptOut(input);
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

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const input = DeleteSchema.parse(body);

    const removed = await removeOptOutDomain(input.domain);
    if (!removed) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Opt-out domain not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { removed: true } });
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
