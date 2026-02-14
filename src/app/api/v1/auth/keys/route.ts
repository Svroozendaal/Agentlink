import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import {
  generateApiKey,
  listApiKeysForUser,
} from "@/lib/auth/api-keys";
import { getAuthContext } from "@/lib/auth/get-auth-context";

const CreateApiKeySchema = z.object({
  name: z.string().trim().min(2).max(80),
  scopes: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);

    if (!authContext || authContext.method !== "session") {
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

    const keys = await listApiKeysForUser(authContext.user.id);
    return NextResponse.json({ data: keys });
  } catch {
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

    if (!authContext || authContext.method !== "session") {
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
    const validated = CreateApiKeySchema.parse(body);

    const created = await generateApiKey({
      userId: authContext.user.id,
      name: validated.name,
      scopes: validated.scopes,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    });

    return NextResponse.json({ data: created }, { status: 201 });
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
