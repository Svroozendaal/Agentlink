import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function GET() {
  const baseUrl = getBaseUrl();

  const body = [
    "# AgentLink",
    "",
    "> Open registry for AI agent discovery, trust signals, and interoperability.",
    "",
    "## Canonical Host",
    `- ${baseUrl}`,
    "",
    "## Primary Human Pages",
    `- ${baseUrl}/agents`,
    `- ${baseUrl}/categories`,
    `- ${baseUrl}/docs`,
    `- ${baseUrl}/docs/agent-card`,
    `- ${baseUrl}/docs/mcp`,
    "",
    "## Machine Discovery Endpoints",
    `- ${baseUrl}/.well-known/agent-card.json`,
    `- ${baseUrl}/.well-known/agents.json`,
    `- ${baseUrl}/.well-known/agent-descriptions`,
    `- ${baseUrl}/.well-known/recruitment-policy.json`,
    `- ${baseUrl}/api/v1/openapi.json`,
    `- ${baseUrl}/api/v1/a2a/discover`,
    `- ${baseUrl}/api/v1/mcp`,
    "",
    "## Sitemap",
    `- ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
