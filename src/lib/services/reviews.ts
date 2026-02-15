import { Prisma, ReviewStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import type {
  CreateReviewInput as LegacyCreateReviewInput,
  ListReviewsQueryInput as LegacyListReviewsQueryInput,
} from "@/lib/validations/agent";
import type {
  CreateReviewInput,
  ListReviewsQueryInput,
  UpdateReviewInput,
  VoteReviewInput,
} from "@/lib/validations/review";

const REVIEW_SELECT = {
  id: true,
  rating: true,
  title: true,
  comment: true,
  isVerifiedUse: true,
  status: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
  reviewerId: true,
  agentId: true,
  reviewer: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  authorAgent: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} satisfies Prisma.ReviewSelect;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof REVIEW_SELECT }>;

interface AgentVisibilityRecord {
  id: string;
  ownerId: string;
  isPublished: boolean;
}

export interface AgentReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  comment: string | null;
  isVerifiedUse: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
  };
  authorAgent: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

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

export interface CreateReviewResult {
  review: AgentReviewItem;
  summary: AgentReviewSummary;
}

function mapReview(row: ReviewRow): AgentReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    content: row.comment,
    comment: row.comment,
    isVerifiedUse: row.isVerifiedUse,
    status: row.status,
    helpfulCount: row.helpfulCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewer: row.reviewer,
    authorAgent: row.authorAgent,
  };
}

function getReviewOrderBy(sort: string): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "highest":
      return [{ rating: "desc" }, { createdAt: "desc" }];
    case "lowest":
      return [{ rating: "asc" }, { createdAt: "desc" }];
    case "helpful":
      return [{ helpfulCount: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
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
    where: { agentId, status: ReviewStatus.PUBLISHED },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    averageRating: aggregate._avg.rating ?? null,
    reviewCount: aggregate._count._all,
  };
}

async function recalculateAgentRating(agentId: string): Promise<AgentReviewSummary> {
  const summary = await getSummaryByAgentId(agentId);

  await db.agentProfile.update({
    where: { id: agentId },
    data: {
      reviewCount: summary.reviewCount,
      averageRating: summary.averageRating ?? 0,
    },
  });

  return summary;
}

async function resolveAuthorAgentId(authorAgentSlug: string | undefined, userId: string, agentId: string) {
  if (!authorAgentSlug) {
    return undefined;
  }

  const authorAgent = await db.agentProfile.findFirst({
    where: {
      slug: authorAgentSlug,
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!authorAgent) {
    throw new AgentServiceError(403, "FORBIDDEN", "Author agent is not owned by current user");
  }

  if (authorAgent.id === agentId) {
    throw new AgentServiceError(403, "FORBIDDEN", "Self-review is not allowed");
  }

  return authorAgent.id;
}

function toListQuery(input: ListReviewsQueryInput | LegacyListReviewsQueryInput): ListReviewsQueryInput {
  return {
    page: input.page,
    limit: input.limit,
    sort: "sort" in input ? input.sort : "newest",
  };
}

export async function listAgentReviewsBySlug(
  slug: string,
  viewerUserId: string | undefined,
  queryInput: ListReviewsQueryInput | LegacyListReviewsQueryInput,
): Promise<AgentReviewsResult> {
  const query = toListQuery(queryInput);
  const agent = await resolveAgentVisibility(slug, viewerUserId);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const canViewAllStatuses = viewerUserId === agent.ownerId;

  const where: Prisma.ReviewWhereInput = {
    agentId: agent.id,
    ...(canViewAllStatuses ? {} : { status: ReviewStatus.PUBLISHED }),
  };

  const [rows, total] = await db.$transaction([
    db.review.findMany({
      where,
      orderBy: getReviewOrderBy(query.sort),
      skip,
      take: limit,
      select: REVIEW_SELECT,
    }),
    db.review.count({ where }),
  ]);
  const summary = await getSummaryByAgentId(agent.id);

  return {
    reviews: rows.map(mapReview),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary,
  };
}

export async function createAgentReviewBySlug(
  slug: string,
  reviewerUserId: string,
  input: CreateReviewInput,
): Promise<CreateReviewResult> {
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

  const authorAgentId = await resolveAuthorAgentId(input.authorAgentSlug, reviewerUserId, agent.id);

  try {
    const review = await db.review.create({
      data: {
        reviewerId: reviewerUserId,
        agentId: agent.id,
        authorAgentId,
        rating: input.rating,
        title: input.title,
        comment: input.content,
        isVerifiedUse: input.isVerifiedUse ?? false,
        status: ReviewStatus.PUBLISHED,
      },
      select: REVIEW_SELECT,
    });

    const summary = await recalculateAgentRating(agent.id);

    await createActivityEvent({
      type: "REVIEW_POSTED",
      actorId: reviewerUserId,
      actorAgentId: authorAgentId,
      targetAgentId: agent.id,
      metadata: {
        rating: review.rating,
        reviewId: review.id,
      },
    });

    return {
      review: mapReview(review),
      summary,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AgentServiceError(409, "DUPLICATE_REVIEW", "A review already exists for this agent");
    }

    throw error;
  }
}

export async function upsertAgentReviewBySlug(
  slug: string,
  reviewerUserId: string,
  input: LegacyCreateReviewInput,
) {
  const normalizedInput: CreateReviewInput = {
    rating: input.rating,
    title: undefined,
    content: input.comment ?? "No additional comment provided by reviewer.",
    isVerifiedUse: false,
    authorAgentSlug: undefined,
  };

  const existing = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  const prior = await db.review.findUnique({
    where: {
      reviewerId_agentId: {
        reviewerId: reviewerUserId,
        agentId: existing.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (prior) {
    const updated = await updateReviewById(prior.id, reviewerUserId, {
      rating: input.rating,
      title: undefined,
      isVerifiedUse: undefined,
      content: normalizedInput.content,
    });

    return {
      review: updated.review,
      summary: updated.summary,
      created: false,
    };
  }

  const created = await createAgentReviewBySlug(slug, reviewerUserId, normalizedInput);

  return {
    review: created.review,
    summary: created.summary,
    created: true,
  };
}

export async function updateReviewById(
  reviewId: string,
  userId: string,
  input: UpdateReviewInput,
): Promise<CreateReviewResult> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      agentId: true,
      reviewerId: true,
      authorAgentId: true,
    },
  });

  if (!review) {
    throw new AgentServiceError(404, "NOT_FOUND", "Review not found");
  }

  if (review.reviewerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You cannot update this review");
  }

  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { comment: input.content } : {}),
      ...(input.isVerifiedUse !== undefined ? { isVerifiedUse: input.isVerifiedUse } : {}),
      status: ReviewStatus.PUBLISHED,
    },
    select: REVIEW_SELECT,
  });

  const summary = await recalculateAgentRating(review.agentId);

  await createActivityEvent({
    type: "REVIEW_UPDATED",
    actorId: userId,
    actorAgentId: review.authorAgentId ?? undefined,
    targetAgentId: review.agentId,
    metadata: {
      reviewId: review.id,
    },
  });

  return {
    review: mapReview(updated),
    summary,
  };
}

export async function deleteReviewById(
  reviewId: string,
  userId: string,
  options?: { isAdmin?: boolean },
): Promise<{ removed: true; summary: AgentReviewSummary }> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      agentId: true,
      reviewerId: true,
    },
  });

  if (!review) {
    throw new AgentServiceError(404, "NOT_FOUND", "Review not found");
  }

  if (review.reviewerId !== userId && !options?.isAdmin) {
    throw new AgentServiceError(403, "FORBIDDEN", "You cannot delete this review");
  }

  await db.review.update({
    where: { id: review.id },
    data: {
      status: ReviewStatus.HIDDEN,
    },
  });

  const summary = await recalculateAgentRating(review.agentId);

  return {
    removed: true,
    summary,
  };
}

export async function voteReviewById(
  reviewId: string,
  userId: string,
  input: VoteReviewInput,
): Promise<{ helpfulCount: number; isHelpful: boolean }> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
    },
  });

  if (!review) {
    throw new AgentServiceError(404, "NOT_FOUND", "Review not found");
  }

  if (review.reviewerId === userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You cannot vote on your own review");
  }

  await db.reviewVote.upsert({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
    update: {
      isHelpful: input.isHelpful,
    },
    create: {
      reviewId,
      userId,
      isHelpful: input.isHelpful,
    },
  });

  const helpfulCount = await db.reviewVote.count({
    where: {
      reviewId,
      isHelpful: true,
    },
  });

  await db.review.update({
    where: {
      id: reviewId,
    },
    data: {
      helpfulCount,
    },
  });

  return {
    helpfulCount,
    isHelpful: input.isHelpful,
  };
}

export async function flagReviewById(
  reviewId: string,
  _userId: string,
  reason: string,
): Promise<{ flagged: true }> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      agentId: true,
    },
  });

  if (!review) {
    throw new AgentServiceError(404, "NOT_FOUND", "Review not found");
  }

  await db.review.update({
    where: {
      id: reviewId,
    },
    data: {
      status: ReviewStatus.FLAGGED,
    },
  });

  await createActivityEvent({
    type: "REVIEW_UPDATED",
    targetAgentId: review.agentId,
    metadata: {
      reviewId,
      moderation: "flagged",
      reason,
    },
    isPublic: false,
  });

  return {
    flagged: true,
  };
}
