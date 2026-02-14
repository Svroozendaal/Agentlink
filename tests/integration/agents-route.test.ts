import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import * as agentService from "@/lib/services/agents";
import { GET, POST } from "@/app/api/v1/agents/route";

vi.mock("@/lib/auth/get-auth-context", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/services/agents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/agents")>(
    "@/lib/services/agents",
  );

  return {
    ...actual,
    listAgents: vi.fn(),
    createAgentProfile: vi.fn(),
  };
});

describe("/api/v1/agents route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated agent list on GET", async () => {
    vi.mocked(agentService.listAgents).mockResolvedValue({
      agents: [
        {
          id: "agent_1",
          slug: "insightbot",
          name: "InsightBot",
          description: "Summary bot",
          skills: ["analysis"],
          tags: [],
          category: "General",
          protocols: ["rest"],
          pricingModel: "FREE",
          isPublished: true,
          isVerified: false,
          logoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: {
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents?page=1&limit=12");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it("should return 400 on invalid query", async () => {
    const request = new NextRequest("http://localhost/api/v1/agents?page=0");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 401 on POST without auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "InsightBot",
        description: "Summary bot for markets",
        longDescription:
          "InsightBot combines news and pricing data to create weekly summaries for product teams.",
        skills: ["analysis"],
        protocols: ["rest"],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should create agent on POST with auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "test@example.com",
        name: "Test User",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentService.createAgentProfile).mockResolvedValue({
      id: "agent_1",
      slug: "insightbot",
      name: "InsightBot",
      description: "Summary bot for markets",
      longDescription:
        "InsightBot combines news and pricing data to create weekly summaries for product teams.",
      skills: ["analysis"],
      tags: [],
      category: "General",
      protocols: ["rest"],
      endpointUrl: null,
      documentationUrl: null,
      websiteUrl: null,
      pricingModel: "FREE",
      pricingDetails: null,
      isPublished: true,
      isVerified: false,
      logoUrl: null,
      bannerUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "user_1",
      owner: { id: "user_1", name: "Test User", image: null },
    });

    const request = new NextRequest("http://localhost/api/v1/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "InsightBot",
        description: "Summary bot for markets",
        longDescription:
          "InsightBot combines news and pricing data to create weekly summaries for product teams.",
        skills: ["analysis"],
        protocols: ["rest"],
        isPublished: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.slug).toBe("insightbot");
  });

  it("should return 400 on invalid POST body", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "test@example.com",
        name: "Test User",
        image: null,
        role: Role.USER,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "x",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
