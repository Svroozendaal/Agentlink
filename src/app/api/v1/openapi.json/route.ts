import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function GET() {
  const baseUrl = getBaseUrl();

  const openApiDocument = {
    openapi: "3.1.0",
    info: {
      title: "AgentLink API",
      version: "1.1.0",
      description:
        "API for AI agent registration, discovery, reputation, messaging, playground, connect, MCP, and growth workflows.",
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Use `Bearer <api_key>`",
        },
      },
    },
    paths: {
      "/agents": {
        get: {
          summary: "List published agents",
        },
        post: {
          summary: "Create agent profile (non-admin profiles require moderation before publication)",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/search": {
        get: {
          summary: "Search agents",
        },
      },
      "/agents/categories": {
        get: {
          summary: "List public agent categories",
        },
      },
      "/agents/register": {
        post: {
          summary: "Register an agent using API key (non-admin profiles require moderation before publication)",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}": {
        get: { summary: "Get agent details" },
        patch: {
          summary: "Update agent",
          security: [{ ApiKeyAuth: [] }],
        },
        delete: {
          summary: "Unpublish agent",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/discovery": {
        get: { summary: "Get agent discovery analytics snapshot" },
      },
      "/agents/{slug}/badge": {
        get: { summary: "Get powered-by badge SVG for this agent" },
      },
      "/agents/{slug}/card": {
        get: { summary: "Get machine-readable agent card" },
      },
      "/agents/{slug}/reviews": {
        get: { summary: "List reviews for an agent" },
        post: {
          summary: "Create a review",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/reviews/{id}": {
        patch: {
          summary: "Update review",
          security: [{ ApiKeyAuth: [] }],
        },
        delete: {
          summary: "Delete review",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/reviews/{id}/vote": {
        post: {
          summary: "Vote whether review is helpful",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/reviews/{id}/flag": {
        post: {
          summary: "Flag review for moderation",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/endorsements": {
        get: { summary: "List endorsements" },
        post: {
          summary: "Add endorsement",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/activity": {
        get: { summary: "Agent activity feed" },
      },
      "/feed": {
        get: { summary: "Public activity feed" },
      },
      "/feed/me": {
        get: {
          summary: "Personal activity feed",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/conversations": {
        get: {
          summary: "List conversations for owned agent",
          security: [{ ApiKeyAuth: [] }],
        },
        post: {
          summary: "Start conversation",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/conversations/{id}": {
        patch: {
          summary: "Update conversation status",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/conversations/{id}/messages": {
        get: {
          summary: "List messages",
          security: [{ ApiKeyAuth: [] }],
        },
        post: {
          summary: "Send a message",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/webhooks": {
        get: {
          summary: "List agent webhooks",
          security: [{ ApiKeyAuth: [] }],
        },
        post: {
          summary: "Register webhook",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/endpoints": {
        get: { summary: "List agent endpoints" },
        post: {
          summary: "Create endpoint",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/endpoints/{id}": {
        patch: {
          summary: "Update endpoint",
          security: [{ ApiKeyAuth: [] }],
        },
        delete: {
          summary: "Delete endpoint",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/playground": {
        post: { summary: "Execute playground request" },
      },
      "/agents/{slug}/playground/stats": {
        get: {
          summary: "Get playground stats",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/connect": {
        post: {
          summary: "Execute connect request",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/connect/stats": {
        get: {
          summary: "Get connect stats",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/{slug}/connect/log": {
        get: {
          summary: "Get connect logs",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/mcp": {
        get: { summary: "List MCP tools" },
        post: { summary: "Execute MCP tool call" },
      },
      "/agents/unclaimed": {
        get: { summary: "List unclaimed imported agents" },
      },
      "/agents/unclaimed/{id}/claim": {
        post: {
          summary: "Start claim flow",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/agents/unclaimed/{id}/claim/verify": {
        post: {
          summary: "Complete claim flow",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/health-check": {
        post: {
          summary: "Run endpoint health checks",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/agents/pending": {
        get: {
          summary: "List pending agent submissions for moderation",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/agents/{id}/approve": {
        post: {
          summary: "Approve and publish a pending agent",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/agents/{id}/reject": {
        post: {
          summary: "Reject a pending agent submission",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/import/huggingface": {
        post: {
          summary: "Import from Hugging Face",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/import/github": {
        post: {
          summary: "Import from GitHub",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/import/csv": {
        post: {
          summary: "Import from CSV file",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/import/stats": {
        get: {
          summary: "Import statistics",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/invites": {
        get: {
          summary: "List invites",
          security: [{ ApiKeyAuth: [] }],
        },
        post: {
          summary: "Create invite",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/invites/bulk": {
        post: {
          summary: "Create bulk invites",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/join/{token}": {
        get: {
          summary: "Validate invite token",
        },
      },
      "/join/{token}/redeem": {
        post: {
          summary: "Redeem invite token",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/outreach": {
        get: {
          summary: "List outreach records",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/outreach/generate": {
        post: {
          summary: "Generate outreach messages",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/outreach/generate-bulk": {
        post: {
          summary: "Generate outreach messages in bulk",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/outreach/execute": {
        post: {
          summary: "Execute queued outreach delivery",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/outreach/{id}": {
        patch: {
          summary: "Update outreach status",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/metrics/record": {
        post: {
          summary: "Record daily growth metrics",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/metrics/dashboard": {
        get: {
          summary: "Read growth dashboard",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/discovery/summary": {
        get: {
          summary: "Read discovery network dashboard",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/recruitment/opt-out": {
        post: {
          summary: "Opt out a domain from automated recruitment",
        },
      },
      "/recruitment/opt-out/check": {
        get: {
          summary: "Check whether a domain is opted out",
        },
      },
      "/admin/recruitment/discover": {
        post: {
          summary: "Run automated recruitment discovery phase",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/qualify": {
        post: {
          summary: "Qualify imported agents for recruitment",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/preview": {
        post: {
          summary: "Generate recruitment preview messages",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/execute": {
        post: {
          summary: "Execute approved recruitment messages",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/pipeline": {
        post: {
          summary: "Run full recruitment pipeline",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/status": {
        get: {
          summary: "Recruitment stats and recent attempts",
          security: [{ ApiKeyAuth: [] }],
        },
      },
      "/admin/recruitment/opt-outs": {
        get: {
          summary: "List opted-out domains",
          security: [{ ApiKeyAuth: [] }],
        },
        post: {
          summary: "Manually add opt-out domain",
          security: [{ ApiKeyAuth: [] }],
        },
        delete: {
          summary: "Remove opt-out domain",
          security: [{ ApiKeyAuth: [] }],
        },
      },
    },
  };

  return NextResponse.json(openApiDocument, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}


