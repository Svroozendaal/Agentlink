import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchAgents } from "@/lib/services/search";
import { SearchAgentsQuerySchema } from "@/lib/validations/agent";

const { queryRawMock, transactionMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  transactionMock: vi.fn(async (operations: Array<Promise<unknown>>) =>
    Promise.all(operations),
  ),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: queryRawMock,
    $transaction: transactionMock,
  },
}));

describe("search service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated results and mapped fields", async () => {
    queryRawMock.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([
      {
        id: "agent_1",
        slug: "supportpilot",
        name: "SupportPilot",
        description: "Support automation agent",
        skills: ["support", "triage"],
        tags: ["saas"],
        category: "Customer Support",
        protocols: ["rest", "a2a"],
        pricingModel: "FREEMIUM",
        isPublished: true,
        isVerified: true,
        logoUrl: null,
        createdAt: new Date("2026-02-14T00:00:00.000Z"),
        updatedAt: new Date("2026-02-14T00:00:00.000Z"),
        rating: 4.6,
        reviewCount: 12,
        relevance: 0.31,
      },
    ]);

    const result = await searchAgents(
      SearchAgentsQuerySchema.parse({
        q: "support",
        page: "1",
        limit: "12",
        sort: "relevance",
      }),
    );

    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(result.agents[0]?.slug).toBe("supportpilot");
    expect(result.agents[0]?.rating).toBe(4.6);
  });

  it("handles empty result sets", async () => {
    queryRawMock.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

    const result = await searchAgents(SearchAgentsQuerySchema.parse({}));

    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(1);
    expect(result.agents).toEqual([]);
  });

  it("accepts special characters in query strings", async () => {
    queryRawMock.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

    const result = await searchAgents(
      SearchAgentsQuerySchema.parse({
        q: "weather + forecast @#$",
      }),
    );

    expect(result.meta.total).toBe(0);
    expect(queryRawMock).toHaveBeenCalledTimes(2);
  });
});
