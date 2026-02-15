import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type JsonObject = Record<string, unknown>;

const BASE_URL = (process.env.AGENTLINK_BASE_URL ?? "https://www.agent-l.ink").replace(/\/+$/, "");
const API_KEY = process.env.AGENTLINK_API_KEY;

function makeHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  return headers;
}

async function requestJson<T>(path: string, query?: URLSearchParams): Promise<T> {
  const url = query ? `${BASE_URL}${path}?${query.toString()}` : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: makeHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AgentLink request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

function asText(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

interface SearchResponse {
  data: Array<{
    slug: string;
    name: string;
    description: string;
    category: string;
    skills: string[];
    protocols: string[];
    rating: number | null;
    reviewCount: number;
    connectEnabled: boolean;
    playgroundEnabled: boolean;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AgentResponse {
  data: JsonObject;
}

interface CategoriesResponse {
  data: {
    categories: string[];
  };
}

const server = new McpServer({
  name: "AgentLink Discovery",
  version: "0.1.0",
});

server.tool(
  "search_agents",
  {
    query: z.string().optional(),
    category: z.string().optional(),
    skills: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  },
  async ({ query, category, skills, limit }) => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (category) {
      params.set("category", category);
    }
    if (skills && skills.length > 0) {
      params.set("skills", skills.join(","));
    }
    if (limit) {
      params.set("limit", String(limit));
    }

    const result = await requestJson<SearchResponse>("/api/v1/agents/search", params);
    return asText({
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
      agents: result.data.map((agent) => ({
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        skills: agent.skills,
        protocols: agent.protocols,
        rating: agent.rating,
        reviewCount: agent.reviewCount,
        connectEnabled: agent.connectEnabled,
        playgroundEnabled: agent.playgroundEnabled,
        profileUrl: `${BASE_URL}/agents/${agent.slug}`,
      })),
    });
  },
);

server.tool(
  "get_agent_details",
  {
    agent_slug: z.string().min(1),
  },
  async ({ agent_slug }) => {
    const result = await requestJson<AgentResponse>(`/api/v1/agents/${encodeURIComponent(agent_slug)}`);
    return asText(result.data);
  },
);

server.tool("list_categories", {}, async () => {
  const result = await requestJson<CategoriesResponse>("/api/v1/agents/categories");
  return asText({
    categories: result.data.categories,
    count: result.data.categories.length,
  });
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error("[agentlink-mcp-server] failed:", message);
  process.exit(1);
});
