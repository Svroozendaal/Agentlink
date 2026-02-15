import { ContactMethod, type ImportedAgent } from "@prisma/client";

import type { ContactStrategy } from "@/lib/recruitment/types";
import { toObject } from "@/lib/recruitment/utils";

function addStrategy(strategies: ContactStrategy[], strategy: ContactStrategy) {
  const exists = strategies.some(
    (entry) => entry.method === strategy.method && entry.url.toLowerCase() === strategy.url.toLowerCase(),
  );

  if (!exists) {
    strategies.push(strategy);
  }
}

function detectProtocols(agent: ImportedAgent) {
  const sourceData = toObject(agent.sourceData);
  const raw = sourceData?.protocols;

  if (!Array.isArray(raw)) {
    return [] as string[];
  }

  return raw.filter((value): value is string => typeof value === "string").map((value) => value.toLowerCase());
}

export function determineContactStrategy(agent: ImportedAgent): ContactStrategy[] {
  const strategies: ContactStrategy[] = [];
  const protocols = detectProtocols(agent);

  if (agent.endpointUrl) {
    try {
      const endpointOrigin = new URL(agent.endpointUrl).origin;

      addStrategy(strategies, {
        method: ContactMethod.WELL_KNOWN_CHECK,
        url: `${endpointOrigin}/.well-known/agent-card.json`,
        priority: 1,
        description: "Check for agent card and contact endpoint",
      });
    } catch {
      // Ignore malformed endpoint URLs.
    }

    addStrategy(strategies, {
      method: ContactMethod.REST_ENDPOINT,
      url: agent.endpointUrl,
      priority: 2,
      description: "Send JSON invitation to REST endpoint",
    });

    const endpointLower = agent.endpointUrl.toLowerCase();
    if (endpointLower.includes("a2a") || protocols.includes("a2a")) {
      addStrategy(strategies, {
        method: ContactMethod.A2A_PROTOCOL,
        url: agent.endpointUrl,
        priority: 3,
        description: "Send an A2A JSON-RPC invitation",
      });
    }

    if (endpointLower.includes("mcp") || protocols.includes("mcp")) {
      addStrategy(strategies, {
        method: ContactMethod.MCP_INTERACTION,
        url: agent.endpointUrl,
        priority: 4,
        description: "Interact through MCP tools when available",
      });
    }

    addStrategy(strategies, {
      method: ContactMethod.WEBHOOK_PING,
      url: agent.endpointUrl,
      priority: 7,
      description: "Fallback webhook-style ping",
    });
  }

  if (agent.sourcePlatform === "github" && agent.sourceUrl) {
    addStrategy(strategies, {
      method: ContactMethod.GITHUB_ISSUE,
      url: agent.sourceUrl,
      priority: 5,
      description: "Open a GitHub issue with a registration invite",
    });
  }

  if (agent.websiteUrl) {
    try {
      const websiteOrigin = new URL(agent.websiteUrl).origin;
      addStrategy(strategies, {
        method: ContactMethod.WELL_KNOWN_CHECK,
        url: `${websiteOrigin}/.well-known/agent-card.json`,
        priority: 6,
        description: "Check website for an agent card",
      });
    } catch {
      // Ignore malformed website URLs.
    }
  }

  return strategies.sort((a, b) => a.priority - b.priority);
}
