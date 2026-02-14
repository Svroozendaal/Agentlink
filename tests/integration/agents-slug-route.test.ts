import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import * as agentService from "@/lib/services/agents";
import { DELETE, GET, PATCH } from "@/app/api/v1/agents/[slug]/route";

vi.mock("@/lib/auth/get-auth-context", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/services/agents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/agents")>(
    "@/lib/services/agents",
  );

  return {
    ...actual,
    getAgentBySlug: vi.fn(),
    updateAgentBySlug: vi.fn(),
    unpublishAgentBySlug: vi.fn(),
  };
});

describe("/api/v1/agents/[slug] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 on GET when agent is missing", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    vi.mocked(agentService.getAgentBySlug).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/agents/missing");
    const response = await GET(request, { params: Promise.resolve({ slug: "missing" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should update agent on PATCH for owner", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentService.updateAgentBySlug).mockResolvedValue({
      id: "agent_1",
      slug: "updated-slug",
      name: "Updated",
      description: "Updated description for agent profile.",
      longDescription:
        "Updated long description for agent profile and this is long enough for schema checks.",
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
      owner: { id: "user_1", name: "Owner", image: null },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/agent-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Updated description for agent profile.",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ slug: "agent-1" }),
    });
    expect(response.status).toBe(200);
  });

  it("should return 403 when service throws ownership error", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentService.updateAgentBySlug).mockRejectedValue(
      new agentService.AgentServiceError(403, "FORBIDDEN", "You do not own this agent"),
    );

    const request = new NextRequest("http://localhost/api/v1/agents/agent-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Updated description for agent profile.",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ slug: "agent-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("should return 401 on DELETE without auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/agents/agent-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "agent-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("should unpublish on DELETE for owner", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentService.unpublishAgentBySlug).mockResolvedValue({
      id: "agent_1",
      slug: "agent-1",
      name: "Agent One",
      description: "Agent profile.",
      longDescription: "Long profile description for this agent profile entry.",
      skills: ["analysis"],
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
      owner: { id: "user_1", name: "Owner", image: null },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/agent-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ slug: "agent-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.isPublished).toBe(false);
  });
});
