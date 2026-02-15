import { ActivityType, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { renderActivityEvent, type FeedItem } from "@/lib/utils/feed-renderer";
import type { FeedQueryInput } from "@/lib/validations/activity";

const ACTIVITY_EVENT_SELECT = {
  id: true,
  type: true,
  metadata: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      name: true,
    },
  },
  actorAgent: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  targetAgent: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} satisfies Prisma.ActivityEventSelect;

type SelectedActivityEvent = Prisma.ActivityEventGetPayload<{
  select: typeof ACTIVITY_EVENT_SELECT;
}>;

export interface FeedResult {
  items: FeedItem[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateActivityEventInput {
  type: ActivityType;
  actorId?: string;
  actorAgentId?: string;
  targetAgentId?: string;
  metadata?: Prisma.InputJsonValue;
  isPublic?: boolean;
}

function toFeedResult(rows: SelectedActivityEvent[], limit: number): FeedResult {
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;

  return {
    items: sliced.map(renderActivityEvent),
    meta: {
      nextCursor,
      hasMore,
    },
  };
}

function buildCursor(cursor: string | undefined): Prisma.ActivityEventWhereUniqueInput | undefined {
  if (!cursor) {
    return undefined;
  }

  return { id: cursor };
}

async function fetchFeed(
  where: Prisma.ActivityEventWhereInput,
  query: FeedQueryInput,
): Promise<FeedResult> {
  const rows = await db.activityEvent.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: buildCursor(query.cursor),
    skip: query.cursor ? 1 : 0,
    take: query.limit + 1,
    select: ACTIVITY_EVENT_SELECT,
  });

  return toFeedResult(rows, query.limit);
}

export async function createActivityEvent(input: CreateActivityEventInput) {
  return db.activityEvent.create({
    data: {
      type: input.type,
      actorId: input.actorId,
      actorAgentId: input.actorAgentId,
      targetAgentId: input.targetAgentId,
      metadata: input.metadata,
      isPublic: input.isPublic ?? true,
    },
  });
}

export async function getPublicFeed(query: FeedQueryInput): Promise<FeedResult> {
  return fetchFeed(
    {
      isPublic: true,
    },
    query,
  );
}

export async function getAgentFeedBySlug(
  slug: string,
  query: FeedQueryInput,
  viewerUserId?: string,
): Promise<FeedResult> {
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

  const canViewPrivate = viewerUserId && viewerUserId === agent.ownerId;

  if (!agent.isPublished && !canViewPrivate) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  return fetchFeed(
    {
      targetAgentId: agent.id,
      ...(canViewPrivate ? {} : { isPublic: true }),
    },
    query,
  );
}

export async function getFeedForUser(userId: string, query: FeedQueryInput): Promise<FeedResult> {
  const ownedAgents = await db.agentProfile.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  const ownedAgentIds = ownedAgents.map((agent) => agent.id);

  if (ownedAgentIds.length === 0) {
    return {
      items: [],
      meta: {
        hasMore: false,
        nextCursor: null,
      },
    };
  }

  return fetchFeed(
    {
      targetAgentId: { in: ownedAgentIds },
    },
    query,
  );
}

export async function getAgentActivityPreview(
  agentId: string,
  limit = 5,
): Promise<FeedItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20));

  const rows = await db.activityEvent.findMany({
    where: {
      targetAgentId: agentId,
      isPublic: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: safeLimit,
    select: ACTIVITY_EVENT_SELECT,
  });

  return rows.map(renderActivityEvent);
}
