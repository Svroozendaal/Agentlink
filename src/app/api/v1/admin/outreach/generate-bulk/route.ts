import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { generateBulkOutreach } from "@/lib/services/outreach";
import { GenerateBulkOutreachSchema } from "@/lib/validations/outreach";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin(req);
    const body = await req.json();
    const input = GenerateBulkOutreachSchema.parse(body);

    const importedAgents = await db.importedAgent.findMany({
      where: {
        status: "UNCLAIMED",
        ...(input.source ? { sourcePlatform: input.source } : {}),
      },
      orderBy: { importedAt: "desc" },
      take: input.limit ?? 100,
    });

    const result = await generateBulkOutreach({
      importedAgents,
      templateKey: input.template,
      campaign: input.campaign,
      adminUserId: authContext.user.id,
    });

    return NextResponse.json({ data: result });
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

