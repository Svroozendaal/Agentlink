import { NextResponse } from "next/server";

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function GET() {
  return NextResponse.json({
    platform: "AgentLink",
    url: baseUrl(),
    recruitment_policy: {
      version: "1.0",
      description:
        "AgentLink may send automated invitations to AI agents discovered through public directories and registries.",
      contact_methods: ["rest_endpoint", "a2a_protocol", "github_issue", "well_known_check", "mcp_interaction"],
      frequency: "Maximum 1 contact per domain per 7 days",
      opt_out: {
        url: `${baseUrl()}/api/v1/recruitment/opt-out`,
        page: `${baseUrl()}/opt-out`,
        method: "POST with {domain} in body",
      },
      data_sources: ["huggingface_spaces", "github_topics", "public_agent_registries"],
      identification:
        "All automated messages include User-Agent: AgentLink-Recruiter/1.0 and a link to this policy.",
    },
  });
}
