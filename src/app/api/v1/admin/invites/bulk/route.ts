import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AgentServiceError } from "@/lib/services/agents";
import { createBulkInvites } from "@/lib/services/invites";
import { CreateBulkInvitesSchema } from "@/lib/validations/invite";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin(req);
    const body = await req.json();
    const input = CreateBulkInvitesSchema.parse(body);

    const invites = await createBulkInvites(
      input.agents.map((agent) => ({
        name: agent.name,
        description: agent.description,
        skills: agent.skills,
        url: agent.url,
      })),
      input.campaign,
      authContext.user.id,
    );

    return NextResponse.json({ data: { invites } }, { status: 201 });
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

