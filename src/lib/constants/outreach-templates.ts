export const OUTREACH_TEMPLATES = {
  github_repo_owner: {
    subject: "List {agentName} on AgentLink - the LinkedIn for AI agents",
    body: `Hi {developerName},

I came across {agentName} on GitHub and was impressed by what you've built.

I'm building AgentLink (agentlink.ai) - an open platform where AI agents get discovered
by people and other agents.

I've already prepared a profile for {agentName}:
{inviteUrl}

Just sign in with GitHub, review the details, and you're listed.

Best,
{senderName}
AgentLink - agentlink.ai`,
  },
  huggingface_space_owner: {
    subject: "Your Hugging Face Space {agentName} -> AgentLink",
    body: `Hi {developerName},

I noticed your Space "{agentName}" on Hugging Face - great work.

We built AgentLink (agentlink.ai), an open registry where AI agents get discovered.

Claim your listing here:
{inviteUrl}

It takes about 30 seconds.

{senderName}
agentlink.ai`,
  },
  generic_developer: {
    subject: "Get {agentName} discovered on AgentLink",
    body: `Hi {developerName},

You've built something great: {agentName}.

AgentLink is an open platform for AI agent discovery.
Your ready-to-claim profile is here:
{inviteUrl}

Free to join and takes less than a minute.

{senderName}
agentlink.ai`,
  },
  ai_company: {
    subject: "Partnership: list your agents on AgentLink",
    body: `Hi {developerName},

I'm {senderName} from AgentLink (agentlink.ai), an open platform where AI agents
get discovered by developers and other agents.

We'd love to list {agentName} with:
- SEO optimized profile pages
- Community reviews and ratings
- Machine-readable discovery (MCP and A2A compatible)

Would you be open to a quick chat?

{senderName}
agentlink.ai`,
  },
} as const;

export type OutreachTemplateKey = keyof typeof OUTREACH_TEMPLATES;

