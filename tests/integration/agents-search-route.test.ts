import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/agents/search/route";
import * as searchService from "@/lib/services/search";

vi.mock("@/lib/services/search", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/search")>(
    "@/lib/services/search",
  );

  return {
    ...actual,
    searchAgents: vi.fn(),
  };
});

describe("/api/v1/agents/search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns search results for valid query params", async () => {
    vi.mocked(searchService.searchAgents).mockResolvedValue({
      agents: [
        {
          id: "agent_1",
          slug: "supportpilot",
          name: "SupportPilot",
          description: "Support automation agent",
          skills: ["support"],
          tags: [],
          category: "Customer Support",
          protocols: ["rest"],
          pricingModel: "FREEMIUM",
          isPublished: true,
          isVerified: true,
          logoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          rating: 4.7,
          reviewCount: 8,
        },
      ],
      meta: {
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      },
    });

    const request = new NextRequest(
      "http://localhost/api/v1/agents/search?q=support&skills=support&sort=relevance",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.total).toBe(1);
    expect(body.data[0].slug).toBe("supportpilot");
  });

  it("supports empty queries and empty results", async () => {
    vi.mocked(searchService.searchAgents).mockResolvedValue({
      agents: [],
      meta: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/search");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it("accepts special characters in q", async () => {
    vi.mocked(searchService.searchAgents).mockResolvedValue({
      agents: [],
      meta: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      },
    });

    const request = new NextRequest(
      "http://localhost/api/v1/agents/search?q=weather+%2B+forecast+%40%23%24",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(searchService.searchAgents).toHaveBeenCalledTimes(1);
  });

  it("returns 400 on invalid query parameters", async () => {
    const request = new NextRequest("http://localhost/api/v1/agents/search?pricing=INVALID");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
