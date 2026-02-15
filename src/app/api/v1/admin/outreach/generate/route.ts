import { NextRequest, NextResponse } from "next/server";
import { ImportStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { createOutreachRecord } from "@/lib/services/outreach";
import { GenerateOutreachSchema } from "@/lib/validations/outreach";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin(req);
    const body = await req.json();
    const input = GenerateOutreachSchema.parse(body);

    const importedAgents = await db.importedAgent.findMany({
      where: {
        id: { in: input.importedAgentIds },
        status: ImportStatus.UNCLAIMED,
      },
    });

    const generated = [];
    for (const importedAgent of importedAgents) {
      const record = await createOutreachRecord({
        targetUrl: importedAgent.sourceUrl,
        targetName: importedAgent.name,
        platform: importedAgent.sourcePlatform,
        templateKey: input.template,
        campaign: input.campaign,
        adminUserId: authContext.user.id,
        agentName: importedAgent.name,
      });

      generated.push({
        targetName: importedAgent.name,
        subject: record.message.subject,
        body: record.message.body,
        inviteUrl: record.message.inviteUrl,
      });
    }

    return NextResponse.json({ data: generated });
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

