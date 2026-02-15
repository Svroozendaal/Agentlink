import { NextRequest, NextResponse } from "next/server";

import { executeMcpToolCall, getMcpToolListing } from "@/lib/mcp/server";
import { assertRateLimit, RateLimitError } from "@/lib/services/rate-limit";

function getIpAddress(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET() {
  return NextResponse.json(getMcpToolListing());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = getIpAddress(req);
    const method = body?.method;
    const toolName = body?.params?.name;

    if (method !== "tools/call") {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Only tools/call is supported",
          },
        },
        { status: 400 },
      );
    }

    if (toolName === "search_agents") {
      assertRateLimit({ bucket: "mcp-search", identifier: ip, max: 100, windowMs: 60 * 60 * 1_000 });
    } else if (toolName === "get_agent_profile" || toolName === "get_agent_details") {
      assertRateLimit({ bucket: "mcp-profile", identifier: ip, max: 200, windowMs: 60 * 60 * 1_000 });
    } else if (toolName === "list_categories") {
      assertRateLimit({ bucket: "mcp-categories", identifier: ip, max: 300, windowMs: 60 * 60 * 1_000 });
    } else if (toolName === "try_agent") {
      assertRateLimit({ bucket: "mcp-try", identifier: ip, max: 50, windowMs: 60 * 60 * 1_000 });
    } else if (toolName === "get_agent_reviews") {
      assertRateLimit({ bucket: "mcp-reviews", identifier: ip, max: 200, windowMs: 60 * 60 * 1_000 });
    }

    const response = await executeMcpToolCall(body, ip);
    return NextResponse.json(response);
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: {
            code: "MCP_ERROR",
            message: error.message,
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
