import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import * as reviewService from "@/lib/services/reviews";
import { GET, POST } from "@/app/api/v1/agents/[slug]/reviews/route";

vi.mock("@/lib/auth/get-auth-context", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/services/reviews", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/reviews")>(
    "@/lib/services/reviews",
  );

  return {
    ...actual,
    listAgentReviewsBySlug: vi.fn(),
    upsertAgentReviewBySlug: vi.fn(),
  };
});

describe("/api/v1/agents/[slug]/reviews route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns reviews on GET", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);
    vi.mocked(reviewService.listAgentReviewsBySlug).mockResolvedValue({
      reviews: [
        {
          id: "review_1",
          rating: 5,
          comment: "Great reliability",
          createdAt: new Date(),
          updatedAt: new Date(),
          reviewer: {
            id: "user_2",
            name: "Reviewer",
            image: null,
          },
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      summary: {
        averageRating: 5,
        reviewCount: 1,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/supportpilot/reviews");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "supportpilot" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.averageRating).toBe(5);
  });

  it("returns 401 on POST without auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/v1/agents/supportpilot/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5 }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ slug: "supportpilot" }),
    });

    expect(response.status).toBe(401);
  });

  it("creates review on POST with auth", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_2",
        email: "reviewer@example.com",
        name: "Reviewer",
        image: null,
        role: Role.USER,
      },
    });

    vi.mocked(reviewService.upsertAgentReviewBySlug).mockResolvedValue({
      created: true,
      review: {
        id: "review_1",
        rating: 4,
        comment: "Strong integration quality.",
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewer: {
          id: "user_2",
          name: "Reviewer",
          image: null,
        },
      },
      summary: {
        averageRating: 4.3,
        reviewCount: 6,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/supportpilot/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, comment: "Strong integration quality." }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ slug: "supportpilot" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.rating).toBe(4);
    expect(body.summary.reviewCount).toBe(6);
  });

  it("returns 400 on invalid POST body", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({
      method: "session",
      user: {
        id: "user_2",
        email: "reviewer@example.com",
        name: "Reviewer",
        image: null,
        role: Role.USER,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/agents/supportpilot/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 9 }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ slug: "supportpilot" }),
    });

    expect(response.status).toBe(400);
  });
});
