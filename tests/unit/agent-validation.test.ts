import { PricingModel } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  CreateAgentSchema,
  ListAgentsQuerySchema,
  RegisterAgentSchema,
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
