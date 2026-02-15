import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function GET() {
  const baseUrl = getBaseUrl();

  return NextResponse.json(
    {
      schema_version: "v1",
      name_for_human: "AgentLink",
      name_for_model: "agentlink_registry",
      description_for_human: "Discover and evaluate AI agents with protocol and trust metadata.",
      description_for_model:
        "Use this service to discover AI agents and retrieve machine-readable discovery metadata including OpenAPI, A2A discovery, and MCP access.",
      auth: {
        type: "none",
      },
      api: {
        type: "openapi",
        url: `${baseUrl}/api/v1/openapi.json`,
      },
      logo_url: `${baseUrl}/globe.svg`,
      contact_email: "privacy@agent-l.ink",
      legal_info_url: `${baseUrl}/terms`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
