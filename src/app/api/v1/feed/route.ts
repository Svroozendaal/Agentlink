import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPublicFeed } from "@/lib/services/activity";
import { FeedQuerySchema } from "@/lib/validations/activity";

export async function GET(req: NextRequest) {
  try {
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = FeedQuerySchema.parse(queryParams);
    const result = await getPublicFeed(query);

    return NextResponse.json({ data: result.items, meta: result.meta });
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
