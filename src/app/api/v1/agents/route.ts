import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
  createAgentProfile,
  listAgents,
} from "@/lib/services/agents";
import { getInviteByToken } from "@/lib/services/invites";
import {
  CreateAgentSchema,
  ListAgentsQuerySchema,
} from "@/lib/validations/agent";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = ListAgentsQuerySchema.parse(queryParams);
    const result = await listAgents(query);

    return NextResponse.json({ data: result.agents, meta: result.meta });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: error.issues,
          },
        },
        { status: 400 },
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

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);

    if (!authContext) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const inviteToken =
      typeof body?.inviteToken === "string" && body.inviteToken.trim().length > 0
        ? body.inviteToken.trim()
        : undefined;
    const validatedBody = CreateAgentSchema.parse(body);
    let createOptions: { autoApprove?: boolean; moderatedById?: string } | undefined;

    if (inviteToken) {
      const invite = await getInviteByToken(inviteToken);
      if (invite && invite.usedCount >= 1) {
        createOptions = {
          autoApprove: true,
          moderatedById: invite.createdByUserId,
        };
      }
    }

    const createdAgent = await createAgentProfile(
      validatedBody,
      authContext.user.id,
      authContext.user.role,
      createOptions,
    );

    return NextResponse.json({ data: createdAgent }, { status: 201 });
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
