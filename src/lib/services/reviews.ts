import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import type { CreateReviewInput, ListReviewsQueryInput } from "@/lib/validations/agent";

const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  reviewer: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.ReviewSelect;

interface AgentVisibilityRecord {
  id: string;
  ownerId: string;
  isPublished: boolean;
}

export type AgentReviewItem = Prisma.ReviewGetPayload<{ select: typeof REVIEW_SELECT }>;

export interface AgentReviewSummary {
  averageRating: number | null;
  reviewCount: number;
}

export interface AgentReviewsResult {
  reviews: AgentReviewItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: AgentReviewSummary;
}

export interface UpsertReviewResult {
  review: AgentReviewItem;
  summary: AgentReviewSummary;
  created: boolean;
}

async function resolveAgentVisibility(
  slug: string,
  viewerUserId?: string,
): Promise<AgentVisibilityRecord> {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      ownerId: true,
      isPublished: true,
    },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (!agent.isPublished && agent.ownerId !== viewerUserId) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  return agent;
}

async function getSummaryByAgentId(agentId: string): Promise<AgentReviewSummary> {
  const aggregate = await db.review.aggregate({
    where: { agentId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    averageRating: aggregate._avg.rating ?? null,
    reviewCount: aggregate._count._all,
  };
}

export async function listAgentReviewsBySlug(
  slug: string,
  viewerUserId: string | undefined,
  query: ListReviewsQueryInput,
): Promise<AgentReviewsResult> {
  const agent = await resolveAgentVisibility(slug, viewerUserId);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [reviews, total, aggregate] = await db.$transaction([
    db.review.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: REVIEW_SELECT,
    }),
    db.review.count({ where: { agentId: agent.id } }),
    db.review.aggregate({
      where: { agentId: agent.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      averageRating: aggregate._avg.rating ?? null,
      reviewCount: aggregate._count._all,
    },
  };
}

export async function upsertAgentReviewBySlug(
  slug: string,
  reviewerUserId: string,
  input: CreateReviewInput,
): Promise<UpsertReviewResult> {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      ownerId: true,
      isPublished: true,
    },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (!agent.isPublished) {
    throw new AgentServiceError(403, "FORBIDDEN", "Cannot review unpublished agents");
  }

  if (agent.ownerId === reviewerUserId) {
    throw new AgentServiceError(403, "FORBIDDEN", "Self-review is not allowed");
  }

  const existing = await db.review.findUnique({
    where: {
      reviewerId_agentId: {
        reviewerId: reviewerUserId,
        agentId: agent.id,
      },
    },
    select: { id: true },
  });

  const review = await db.review.upsert({
    where: {
      reviewerId_agentId: {
        reviewerId: reviewerUserId,
        agentId: agent.id,
      },
    },
    update: {
      rating: input.rating,
      comment: input.comment,
    },
    create: {
      reviewerId: reviewerUserId,
      agentId: agent.id,
      rating: input.rating,
      comment: input.comment,
    },
    select: REVIEW_SELECT,
  });

  const summary = await getSummaryByAgentId(agent.id);

  return {
    review,
    summary,
    created: !existing,
  };
}
