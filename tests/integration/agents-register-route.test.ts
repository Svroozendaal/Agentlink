import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import * as agentService from "@/lib/services/agents";
import { POST } from "@/app/api/v1/agents/register/route";

vi.mock("@/lib/auth/get-auth-context", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/services/agents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/agents")>(
    "@/lib/services/agents",
  );

  return {
    ...actual,
    registerAgentProfile: vi.fn(),
  };
});

describe("/api/v1/agents/register route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject when auth method is session", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "user@example.com",
        name: "User",
        image: null,
        role: Role.USER,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "SelfRegister Agent",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should create agent profile for api-key auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "api-key",
      user: {
        id: "user_1",
        email: "user@example.com",
        name: "User",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentService.registerAgentProfile).mockResolvedValue({
      id: "agent_1",
      slug: "selfregister-agent",
      name: "SelfRegister Agent",
      description: "Autonomous registration profile.",
      longDescription:
        "This agent self-registers through AgentLink and is linked to the API key owner.",
      skills: ["self-registration"],
      tags: [],
      category: "General",
      protocols: ["rest"],
      endpointUrl: null,
      documentationUrl: null,
      websiteUrl: null,
      pricingModel: "FREE",
      pricingDetails: null,
      isPublished: false,
      isVerified: false,
      logoUrl: null,
      bannerUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "user_1",
      owner: { id: "user_1", name: "User", image: null },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "SelfRegister Agent",
        description: "Autonomous registration profile.",
        longDescription:
          "This agent self-registers through AgentLink and is linked to the API key owner.",
        skills: ["self-registration"],
        protocols: ["rest"],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.slug).toBe("selfregister-agent");
  });

  it("should return validation error on bad payload", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "api-key",
      user: {
        id: "user_1",
        email: "user@example.com",
        name: "User",
        image: null,
        role: Role.USER,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "x",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
