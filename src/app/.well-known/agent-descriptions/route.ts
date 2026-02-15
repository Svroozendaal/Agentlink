import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function GET() {
  const baseUrl = getBaseUrl();

  return NextResponse.json({
    name: "AgentLink Registry",
    description: "Alias endpoint for agent discovery metadata.",
    url: `${baseUrl}/.well-known/agent-card.json`,
    capabilities: [
      "agent-discovery",
      "agent-registration",
      "agent-playground",
      "agent-connect",
      "mcp-server",
    ],
    mcp: {
      url: `${baseUrl}/api/v1/mcp`,
      config: `${baseUrl}/mcp-config.json`,
    },
  });
}
