import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listUnclaimedImports } from "@/lib/services/import";
import { UnclaimedAgentsQuerySchema } from "@/lib/validations/import";

export async function GET(req: NextRequest) {
  try {
    const query = UnclaimedAgentsQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    const result = await listUnclaimedImports(query);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid query", details: error.issues } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}

