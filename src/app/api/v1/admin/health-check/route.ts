import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { checkAllEndpointsHealth } from "@/lib/services/health-check";
import { RateLimitError } from "@/lib/services/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    if (authContext.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      );
    }

    const result = await checkAllEndpointsHealth();
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof RateLimitError) {
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

