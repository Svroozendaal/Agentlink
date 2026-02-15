import { getAgentBySlug } from "@/lib/services/agents";

interface BuildAgentCardOptions {
  viewerUserId?: string;
}

export interface AgentCardPayload {
  agent_id: string;
  name: string;
  provider: {
    name: string;
    verified: boolean;
  };
  description: string;
  long_description?: string;
  skills: string[];
  protocols: string[];
  endpoint?: string;
  pricing: {
    model: string;
    details?: string;
  };
  reputation: {
    rating: number | null;
    reviews: number;
    endorsements: number;
  };
  availability: {
    uptime?: string;
    average_response_ms?: number;
    rate_limit?: string;
  };
  links: {
    website?: string;
    documentation?: string;
  };
  metadata?: Record<string, unknown>;
}

function readStringField(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumberField(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key];
  return typeof value === "number" ? value : undefined;
}

export async function buildAgentCardBySlug(
  slug: string,
  options: BuildAgentCardOptions = {},
): Promise<AgentCardPayload | null> {
  const agent = await getAgentBySlug(slug, options.viewerUserId);

  if (!agent) {
    return null;
  }

  const metadata =
    agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
      ? (agent.metadata as Record<string, unknown>)
      : undefined;
  const uptime = readStringField(metadata, "uptime");
  const averageResponseMs = readNumberField(metadata, "average_response_ms");
  const rateLimit = readStringField(metadata, "rate_limit");

  return {
    agent_id: `agentlink:${agent.slug}`,
    name: agent.name,
    provider: {
      name: agent.owner.name ?? "Unknown provider",
      verified: agent.isVerified,
    },
    description: agent.description,
    ...(agent.longDescription ? { long_description: agent.longDescription } : {}),
    skills: agent.skills,
    protocols: agent.protocols,
    ...(agent.endpointUrl ? { endpoint: agent.endpointUrl } : {}),
    pricing: {
      model: agent.pricingModel.toLowerCase(),
      ...(agent.pricingDetails ? { details: agent.pricingDetails } : {}),
    },
    reputation: {
      rating: agent.reviewCount > 0 ? agent.averageRating : null,
      reviews: agent.reviewCount,
      endorsements: agent.endorsementCount,
    },
    availability: {
      ...(uptime ? { uptime } : {}),
      ...(averageResponseMs !== undefined ? { average_response_ms: averageResponseMs } : {}),
      ...(rateLimit ? { rate_limit: rateLimit } : {}),
    },
    links: {
      ...(agent.websiteUrl ? { website: agent.websiteUrl } : {}),
      ...(agent.documentationUrl ? { documentation: agent.documentationUrl } : {}),
    },
    ...(metadata ? { metadata } : {}),
  };
}
