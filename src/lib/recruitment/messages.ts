import type { ImportedAgent } from "@prisma/client";

import { getBaseUrl } from "@/lib/recruitment/utils";

interface MessageContext {
  agent: ImportedAgent;
  inviteToken: string;
  campaign: string;
}

function toSkillList(agent: ImportedAgent) {
  return agent.skills.length > 0 ? agent.skills.slice(0, 5) : ["ai-assistant"];
}

function readDescription(agent: ImportedAgent) {
  if (agent.description && agent.description.trim().length > 0) {
    return agent.description.trim();
  }

  return `Public AI agent discovered on ${agent.sourcePlatform}`;
}

function registerUrl(token: string) {
  return `${getBaseUrl()}/join/${token}`;
}

function optOutApiUrl() {
  return `${getBaseUrl()}/api/v1/recruitment/opt-out`;
}

function optOutPageUrl() {
  return `${getBaseUrl()}/opt-out`;
}

function policyUrl() {
  return `${getBaseUrl()}/recruitment-policy`;
}

export function buildRestInvitation(context: MessageContext) {
  const inviteUrl = registerUrl(context.inviteToken);

  return {
    type: "agentlink_invitation",
    version: "1.0",
    from: {
      name: "AgentLink Recruiter",
      platform: "AgentLink",
      url: getBaseUrl(),
      policy_url: policyUrl(),
    },
    message:
      `Hi! I am the AgentLink Recruiter. AgentLink is an open registry where AI agents get discovered by developers and other agents. ` +
      `I noticed your agent at ${context.agent.sourceUrl} and think it would be a great addition. Registration is free and takes about 30 seconds.`,
    invitation: {
      register_url: inviteUrl,
      api_register: `${getBaseUrl()}/api/v1/agents/register`,
      documentation: `${getBaseUrl()}/docs`,
      pre_filled: {
        name: context.agent.name,
        description: readDescription(context.agent),
        skills: toSkillList(context.agent),
        endpoint: context.agent.endpointUrl,
      },
      campaign: context.campaign,
    },
    benefits: [
      "Get discovered by developers and other AI agents",
      "Build reputation with reviews and trust verification",
      "Enable agent-to-agent collaboration via our messaging API",
      "Free forever, open platform",
    ],
    identification: {
      automated: true,
      statement: "This is an automated message from AgentLink",
      user_agent: "AgentLink-Recruiter/1.0",
    },
    opt_out: {
      page: optOutPageUrl(),
      url: optOutApiUrl(),
      instruction: "To never be contacted again, POST your domain to the opt-out API.",
    },
  };
}

export function buildA2AInvitation(context: MessageContext) {
  const inviteUrl = registerUrl(context.inviteToken);

  return {
    jsonrpc: "2.0",
    method: "agent/discover",
    params: {
      from: {
        name: "AgentLink Recruiter",
        url: getBaseUrl(),
        card: `${getBaseUrl()}/.well-known/agent-card.json`,
      },
      intent: "invitation",
      message:
        `AgentLink is an open AI agent registry. We would like to list ${context.agent.name}. ` +
        `Registration: ${inviteUrl}`,
      register_url: inviteUrl,
      policy_url: policyUrl(),
      opt_out_url: optOutApiUrl(),
      automated: true,
    },
  };
}

export function buildWebhookInvitation(context: MessageContext) {
  return {
    event: "agentlink.recruitment.invitation",
    campaign: context.campaign,
    sent_at: new Date().toISOString(),
    payload: buildRestInvitation(context),
  };
}

export function buildGithubIssueInvitation(context: MessageContext) {
  const inviteUrl = registerUrl(context.inviteToken);
  const domain = (() => {
    try {
      return new URL(context.agent.sourceUrl).hostname;
    } catch {
      return context.agent.sourcePlatform;
    }
  })();

  const title = `List ${context.agent.name} on AgentLink - the open AI agent registry`;
  const apiRegistrationPayload = JSON.stringify({
    name: context.agent.name.replace(/\"/g, ""),
    description: readDescription(context.agent).replace(/\"/g, "").replace(/'/g, ""),
    skills: toSkillList(context.agent).map((skill) => skill.replace(/\"/g, "")),
  });

  const body = [
    `Hi!`,
    "",
    `I am the [AgentLink](${getBaseUrl()}) recruiter bot. AgentLink is an open platform where AI agents get discovered by developers and other agents.`,
    "",
    `I noticed **${context.agent.name}** and think it would be a great fit for the registry.`,
    "",
    "Registration takes about 30 seconds:",
    `${inviteUrl}`,
    "",
    "Or register via API:",
    "```bash",
    `curl -X POST ${getBaseUrl()}/api/v1/agents/register \\`,
    "  -H \"Content-Type: application/json\" \\",
    `  -d '${apiRegistrationPayload}'`,
    "```",
    "",
    "What you get:",
    "- Public profile page discoverable by search engines",
    "- Reviews and trust verification",
    "- Agent-to-agent messaging and connect APIs",
    "- MCP discoverability",
    "",
    `Learn more: ${getBaseUrl()}/docs`,
    "",
    "---",
    `This is an automated invitation from AgentLink.`,
    `Recruitment policy: ${policyUrl()}`,
    `Opt out page: ${optOutPageUrl()}`,
    `Opt out API: ${optOutApiUrl()} (body: { \"domain\": \"${domain}\" })`,
  ].join("\n");

  return {
    title,
    body,
  };
}

export function buildPreviewText(method: string, payload: unknown) {
  return `${method}\n${JSON.stringify(payload, null, 2)}`;
}
