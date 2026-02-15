import { listAgentReviewsBySlug } from "@/lib/services/reviews";
import { getAgentBySlug } from "@/lib/services/agents";
import { listEndpoints } from "@/lib/services/endpoints";
import { executePlaygroundRequest } from "@/lib/services/playground";
import { searchAgents } from "@/lib/services/search";

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpRequestPayload {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "search_agents",
    description:
      "Search the AgentLink registry to find AI agents by skills, category, or description. Returns a list of matching agents with their profiles.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (name, description, or skills)",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Filter by specific skills",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by specific tags",
        },
        category: { type: "string", description: "Filter by category" },
        protocols: {
          type: "array",
          items: { type: "string" },
          description: "Filter by supported protocols (rest, a2a, mcp, etc.)",
        },
        minRating: { type: "number", description: "Minimum average rating (1-5)" },
        limit: { type: "number", description: "Max results (default 5, max 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_agent_profile",
    description:
      "Get the full profile of an AI agent on AgentLink, including description, skills, endpoints, ratings, and how to connect.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The agent's unique slug identifier" },
      },
      required: ["slug"],
    },
  },
  {
    name: "try_agent",
    description:
      "Send a test request to an AI agent via the AgentLink playground. The agent must have playground enabled.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The agent's slug" },
        request: { type: "object", description: "The request body to send to the agent" },
      },
      required: ["slug", "request"],
    },
  },
  {
    name: "get_agent_reviews",
    description: "Get reviews and ratings for an AI agent on AgentLink.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The agent's slug" },
        limit: { type: "number", description: "Max reviews to return (default 5)" },
      },
      required: ["slug"],
    },
  },
];

function readString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value.filter((item): item is string => typeof item === "string");
  return values.length > 0 ? values : undefined;
}

function readLimit(value: unknown, fallback = 5, max = 20) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(value), max));
}

function readRating(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(1, Math.min(5, Math.floor(value)));
}

function toTextContent(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function logMcpCall(toolName: string, args: Record<string, unknown>, durationMs: number) {
  if (process.env.NODE_ENV !== "test") {
    console.info("[mcp]", { toolName, args, durationMs });
  }
}

async function callSearchAgents(args: Record<string, unknown>) {
  const result = await searchAgents({
    q: readString(args.query, "").trim() || undefined,
    skills: readStringArray(args.skills),
    tags: readStringArray(args.tags),
    protocols: readStringArray(args.protocols),
    endpointTypes: undefined,
    category: readString(args.category, "").trim() || undefined,
    pricing: undefined,
    minRating: readRating(args.minRating),
    verified: undefined,
    playground: undefined,
    connect: undefined,
    sort: "relevance",
    page: 1,
    limit: readLimit(args.limit, 5, 20),
  });

  return {
    query: readString(args.query, ""),
    total: result.meta.total,
    agents: result.agents.map((agent) => ({
      slug: agent.slug,
      name: agent.name,
      description: agent.description,
      skills: agent.skills,
      category: agent.category,
      rating: agent.rating,
      reviewCount: agent.reviewCount,
      protocols: agent.protocols,
    })),
  };
}

async function callGetAgentProfile(args: Record<string, unknown>) {
  const slug = readString(args.slug).trim();
  if (!slug) {
    throw new Error("Missing required argument: slug");
  }

  const [agent, endpoints] = await Promise.all([getAgentBySlug(slug), listEndpoints(slug)]);
  if (!agent) {
    throw new Error("Agent not found");
  }

  return {
    slug: agent.slug,
    name: agent.name,
    description: agent.description,
    longDescription: agent.longDescription,
    skills: agent.skills,
    category: agent.category,
    protocols: agent.protocols,
    pricingModel: agent.pricingModel,
    averageRating: agent.averageRating,
    reviewCount: agent.reviewCount,
    endorsementCount: agent.endorsementCount,
    playgroundEnabled: agent.playgroundEnabled,
    connectEnabled: agent.connectEnabled,
    endpoints,
  };
}

async function callTryAgent(args: Record<string, unknown>, ipAddress?: string) {
  const slug = readString(args.slug).trim();
  const request = args.request;

  if (!slug) {
    throw new Error("Missing required argument: slug");
  }

  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Missing required argument: request");
  }

  const result = await executePlaygroundRequest({
    agentSlug: slug,
    requestBody: request as Record<string, unknown>,
    ipAddress,
    rateBucket: "mcp-playground",
  });

  return {
    slug,
    ...result,
  };
}

async function callGetAgentReviews(args: Record<string, unknown>) {
  const slug = readString(args.slug).trim();
  if (!slug) {
    throw new Error("Missing required argument: slug");
  }

  const limit = readLimit(args.limit, 5, 20);
  const result = await listAgentReviewsBySlug(slug, undefined, {
    page: 1,
    limit,
    sort: "newest",
  });

  return {
    slug,
    summary: result.summary,
    reviews: result.reviews,
  };
}

export async function executeMcpToolCall(
  payload: McpRequestPayload,
  ipAddress?: string,
) {
  if (payload.method !== "tools/call") {
    throw new Error("Unsupported MCP method");
  }

  const toolName = payload.params?.name;
  const args = payload.params?.arguments ?? {};

  if (!toolName) {
    throw new Error("Missing tool name");
  }

  const startedAt = Date.now();
  let result: unknown;

  if (toolName === "search_agents") {
    result = await callSearchAgents(args);
  } else if (toolName === "get_agent_profile") {
    result = await callGetAgentProfile(args);
  } else if (toolName === "try_agent") {
    result = await callTryAgent(args, ipAddress);
  } else if (toolName === "get_agent_reviews") {
    result = await callGetAgentReviews(args);
  } else {
    throw new Error(`Unknown MCP tool: ${toolName}`);
  }

  logMcpCall(toolName, args, Date.now() - startedAt);
  return toTextContent(result);
}

export function getMcpToolListing() {
  return {
    name: "agentlink",
    description: "Search, discover, and try AI agents from the AgentLink registry",
    version: "1.0.0",
    tools: MCP_TOOLS,
  };
}
