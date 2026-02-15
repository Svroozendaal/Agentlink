import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";
import { deleteAgentWebhook } from "@/lib/services/webhooks";
import { AgentSlugParamsSchema } from "@/lib/validations/agent";
import { WebhookIdParamsSchema } from "@/lib/validations/webhook";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
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

    const resolvedParams = await params;
    const validatedSlug = AgentSlugParamsSchema.parse({ slug: resolvedParams.slug });
    const validatedWebhook = WebhookIdParamsSchema.parse({ id: resolvedParams.id });

    await deleteAgentWebhook(validatedSlug.slug, validatedWebhook.id, authContext.user.id);

    return NextResponse.json({ data: { message: "Webhook removed" } });
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
