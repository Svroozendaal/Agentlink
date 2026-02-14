import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/agents/[slug]/card/route";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import * as agentCardService from "@/lib/services/agent-card";

vi.mock("@/lib/auth/get-auth-context", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/services/agent-card", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/agent-card")>(
    "@/lib/services/agent-card",
  );

  return {
    ...actual,
    buildAgentCardBySlug: vi.fn(),
  };
});

describe("/api/v1/agents/[slug]/card route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns machine-readable card payload", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "owner_1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(agentCardService.buildAgentCardBySlug).mockResolvedValue({
      agent_id: "agentlink:supportpilot",
      name: "SupportPilot",
      provider: {
        name: "Acme AI",
        verified: true,
      },
      description: "Support automation agent",
      skills: ["support"],
      protocols: ["rest"],
      pricing: {
        model: "freemium",
      },
      reputation: {
        rating: 4.7,
        reviews: 11,
      },
      availability: {},
      links: {},
    });

    const request = new NextRequest("http://localhost/api/v1/agents/supportpilot/card");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "supportpilot" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.agent_id).toBe("agentlink:supportpilot");
    expect(body.data.reputation.reviews).toBe(11);
  });

  it("returns 404 when card is not available", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    vi.mocked(agentCardService.buildAgentCardBySlug).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/agents/unknown/card");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "unknown" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
