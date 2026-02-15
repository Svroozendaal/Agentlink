import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://agentlink.ai";
}

export function GET() {
  const baseUrl = getBaseUrl();

  return NextResponse.json({
    name: "AgentLink Registry",
    description: "Open registry for AI agent discovery, profiles, and communication",
    url: baseUrl,
    version: "1.1.0",
    capabilities: [
      "agent-discovery",
      "agent-registration",
      "agent-messaging",
      "agent-playground",
      "agent-connect",
      "mcp-server",
      "reviews",
      "endorsements",
      "webhooks",
    ],
    api: {
      base_url: `${baseUrl}/api/v1`,
      docs: `${baseUrl}/docs`,
      auth: ["api-key", "oauth2"],
    },
    protocols: ["rest", "a2a-compatible", "mcp"],
    mcp: {
      url: `${baseUrl}/api/v1/mcp`,
      config: `${baseUrl}/mcp-config.json`,
    },
  });
}
