import { PricingModel } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  CreateAgentSchema,
  CreateReviewSchema,
  ListAgentsQuerySchema,
  ListReviewsQuerySchema,
  RegisterAgentSchema,
  SearchAgentsQuerySchema,
  UpdateAgentSchema,
} from "@/lib/validations/agent";

describe("CreateAgentSchema", () => {
  it("should accept valid payload", () => {
    const result = CreateAgentSchema.safeParse({
      name: "InsightBot",
      description: "AI assistant for market insight summaries.",
      longDescription:
        "InsightBot combines pricing and news signals to create short daily market digests for growth teams.",
      skills: ["analysis", "summarization"],
      protocols: ["rest", "mcp"],
      pricingModel: PricingModel.FREEMIUM,
      endpointUrl: "https://api.insightbot.ai/v1",
      websiteUrl: "https://insightbot.ai",
    });

    expect(result.success).toBe(true);
  });

  it("should reject missing skills", () => {
    const result = CreateAgentSchema.safeParse({
      name: "InsightBot",
      description: "AI assistant for market insight summaries.",
      protocols: ["rest"],
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateAgentSchema", () => {
  it("should reject empty body", () => {
    const result = UpdateAgentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should accept partial update", () => {
    const result = UpdateAgentSchema.safeParse({
      description: "Updated description for agent.",
    });

    expect(result.success).toBe(true);
  });
});

describe("ListAgentsQuerySchema", () => {
  it("should parse comma-separated filters", () => {
    const result = ListAgentsQuerySchema.parse({
      page: "2",
      limit: "5",
      skills: "analysis, research,analysis",
      protocols: "rest,mcp",
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.skills).toEqual(["analysis", "research"]);
    expect(result.protocols).toEqual(["rest", "mcp"]);
  });
});

describe("RegisterAgentSchema", () => {
  it("should accept agent-card style payload", () => {
    const result = RegisterAgentSchema.safeParse({
      agentCardVersion: "1.0",
      name: "SelfRegister Agent",
      description: "Autonomous registration profile.",
      longDescription:
        "This agent can self-register through the AgentLink endpoint with API key auth.",
      skills: ["self-registration"],
      protocols: ["rest"],
    });

    expect(result.success).toBe(true);
  });
});

describe("SearchAgentsQuerySchema", () => {
  it("should parse boolean and comma-separated filters", () => {
    const result = SearchAgentsQuerySchema.parse({
      q: "support",
      skills: "support,triage",
      protocols: "rest,a2a",
      verified: "true",
      sort: "rating",
    });

    expect(result.skills).toEqual(["support", "triage"]);
    expect(result.protocols).toEqual(["rest", "a2a"]);
    expect(result.verified).toBe(true);
    expect(result.sort).toBe("rating");
  });
});

describe("CreateReviewSchema", () => {
  it("should accept valid review payload", () => {
    const result = CreateReviewSchema.safeParse({
      rating: 5,
      comment: "Excellent reliability and clear API docs.",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid rating", () => {
    const result = CreateReviewSchema.safeParse({
      rating: 7,
    });

    expect(result.success).toBe(false);
  });
});

describe("ListReviewsQuerySchema", () => {
  it("should apply defaults", () => {
    const result = ListReviewsQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});
