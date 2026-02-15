import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { createInvite, listInvites } from "@/lib/services/invites";
import { CreateInviteSchema, ListInvitesQuerySchema } from "@/lib/validations/invite";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin(req);
    const body = await req.json();
    const input = CreateInviteSchema.parse(body);
    const invite = await createInvite({
      campaign: input.campaign,
      agentName: input.agentName,
      agentData: input.agentData,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt,
      adminUserId: authContext.user.id,
    });

    return NextResponse.json({ data: invite }, { status: 201 });
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

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const query = ListInvitesQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    const result = await listInvites(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid query", details: error.issues } },
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

