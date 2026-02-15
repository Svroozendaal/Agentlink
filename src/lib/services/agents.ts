import { Prisma, PricingModel } from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { slugify, ensureUniqueSlug } from "@/lib/utils/slugify";
import type {
  CreateAgentInput,
  ListAgentsQueryInput,
  RegisterAgentInput,
  UpdateAgentInput,
} from "@/lib/validations/agent";

const AGENT_SUMMARY_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  skills: true,
  tags: true,
  category: true,
  protocols: true,
  pricingModel: true,
  isPublished: true,
  isVerified: true,
  averageRating: true,
  reviewCount: true,
  endorsementCount: true,
  acceptsMessages: true,
  playgroundEnabled: true,
  connectEnabled: true,
  isEarlyAdopter: true,
  logoUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AgentProfileSelect;

const AGENT_DETAIL_SELECT = {
  ...AGENT_SUMMARY_SELECT,
  longDescription: true,
  endpointUrl: true,
  documentationUrl: true,
  websiteUrl: true,
  pricingDetails: true,
  bannerUrl: true,
  metadata: true,
  ownerId: true,
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.AgentProfileSelect;

const OWNED_AGENT_SELECT = {
  id: true,
  slug: true,
  name: true,
  isPublished: true,
  averageRating: true,
  reviewCount: true,
  endorsementCount: true,
  acceptsMessages: true,
  playgroundEnabled: true,
  connectEnabled: true,
  isEarlyAdopter: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.AgentProfileSelect;

export type AgentSummary = Prisma.AgentProfileGetPayload<{ select: typeof AGENT_SUMMARY_SELECT }>;
export type AgentDetail = Prisma.AgentProfileGetPayload<{ select: typeof AGENT_DETAIL_SELECT }>;
export type OwnedAgentSummary = Prisma.AgentProfileGetPayload<{
  select: typeof OWNED_AGENT_SELECT;
}>;

export interface AgentListResult {
  agents: AgentSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AgentServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AgentServiceError";
    this.status = status;
    this.code = code;
  }
}

function uniqueArray(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

async function generateUniqueSlug(name: string, excludeAgentId?: string): Promise<string> {
  const baseSlug = slugify(name);

  return ensureUniqueSlug(baseSlug, async (candidateSlug) => {
    const existing = await db.agentProfile.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    if (excludeAgentId && existing.id === excludeAgentId) {
      return false;
    }

    return true;
  });
}

function mapCreateData(
  input: CreateAgentInput,
  ownerId: string,
  slug: string,
  isEarlyAdopter: boolean,
): Prisma.AgentProfileCreateInput {
  return {
    slug,
    name: input.name,
    description: input.description,
    longDescription: input.longDescription,
    owner: {
      connect: {
        id: ownerId,
      },
    },
    skills: uniqueArray(input.skills),
    tags: uniqueArray(input.tags ?? []),
    category: input.category ?? "General",
    protocols: uniqueArray(input.protocols),
    endpointUrl: input.endpointUrl,
    documentationUrl: input.documentationUrl,
    websiteUrl: input.websiteUrl,
    pricingModel: input.pricingModel ?? PricingModel.FREE,
    pricingDetails: input.pricingDetails,
    isPublished: input.isPublished ?? false,
    acceptsMessages: input.acceptsMessages ?? true,
    playgroundEnabled: input.playgroundEnabled ?? false,
    connectEnabled: input.connectEnabled ?? false,
    isEarlyAdopter,
    logoUrl: input.logoUrl,
    bannerUrl: input.bannerUrl,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
  };
}

export async function createAgentProfile(
  input: CreateAgentInput,
  ownerId: string,
): Promise<AgentDetail> {
  const slug = await generateUniqueSlug(input.name);
  const totalAgents = await db.agentProfile.count();
  const isEarlyAdopter = totalAgents < 500;

  const created = await db.agentProfile.create({
    data: mapCreateData(input, ownerId, slug, isEarlyAdopter),
    select: AGENT_DETAIL_SELECT,
  });

  await createActivityEvent({
    type: "AGENT_CREATED",
    actorId: ownerId,
    targetAgentId: created.id,
    metadata: {
      slug: created.slug,
      source: "web",
    },
  });

  return created;
}

export async function registerAgentProfile(
  input: RegisterAgentInput,
  ownerId: string,
): Promise<AgentDetail> {
  const normalizedInput: CreateAgentInput = {
    ...input,
    isPublished: input.isPublished ?? false,
  };

  const created = await createAgentProfile(normalizedInput, ownerId);

  await createActivityEvent({
    type: "AGENT_REGISTERED_VIA_API",
    actorId: ownerId,
    targetAgentId: created.id,
    metadata: {
      slug: created.slug,
      source: "api",
    },
  });

  return created;
}

export async function listAgents(query: ListAgentsQueryInput): Promise<AgentListResult> {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Prisma.AgentProfileWhereInput = {
    isPublished: true,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { longDescription: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category
      ? {
          category: { equals: query.category, mode: "insensitive" },
        }
      : {}),
    ...(query.skills && query.skills.length > 0 ? { skills: { hasSome: query.skills } } : {}),
    ...(query.tags && query.tags.length > 0 ? { tags: { hasSome: query.tags } } : {}),
    ...(query.protocols && query.protocols.length > 0
      ? { protocols: { hasSome: query.protocols } }
      : {}),
  };

  const [agents, total] = await db.$transaction([
    db.agentProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: AGENT_SUMMARY_SELECT,
    }),
    db.agentProfile.count({ where }),
  ]);

  return {
    agents,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAgentBySlug(
  slug: string,
  viewerUserId?: string,
): Promise<AgentDetail | null> {
  if (viewerUserId) {
    return db.agentProfile.findFirst({
      where: {
        slug,
        OR: [{ isPublished: true }, { ownerId: viewerUserId }],
      },
      select: AGENT_DETAIL_SELECT,
    });
  }

  return db.agentProfile.findFirst({
    where: {
      slug,
      isPublished: true,
    },
    select: AGENT_DETAIL_SELECT,
  });
}

export async function listOwnedAgents(ownerId: string): Promise<OwnedAgentSummary[]> {
  return db.agentProfile.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: OWNED_AGENT_SELECT,
  });
}

export async function updateAgentBySlug(
  slug: string,
  ownerId: string,
  input: UpdateAgentInput,
): Promise<AgentDetail> {
  const existing = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true, slug: true, isPublished: true },
  });

  if (!existing) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (existing.ownerId !== ownerId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  const nextSlug =
    input.name && input.name !== existing.name
      ? await generateUniqueSlug(input.name, existing.id)
      : existing.slug;

  const updated = await db.agentProfile.update({
    where: { id: existing.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.longDescription !== undefined ? { longDescription: input.longDescription } : {}),
      ...(input.skills ? { skills: uniqueArray(input.skills) } : {}),
      ...(input.tags ? { tags: uniqueArray(input.tags) } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.protocols ? { protocols: uniqueArray(input.protocols) } : {}),
      ...(input.endpointUrl !== undefined ? { endpointUrl: input.endpointUrl } : {}),
      ...(input.documentationUrl !== undefined
        ? { documentationUrl: input.documentationUrl }
        : {}),
      ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl } : {}),
      ...(input.pricingModel ? { pricingModel: input.pricingModel } : {}),
      ...(input.pricingDetails !== undefined ? { pricingDetails: input.pricingDetails } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      ...(input.acceptsMessages !== undefined
        ? { acceptsMessages: input.acceptsMessages }
        : {}),
      ...(input.playgroundEnabled !== undefined
        ? { playgroundEnabled: input.playgroundEnabled }
        : {}),
      ...(input.connectEnabled !== undefined ? { connectEnabled: input.connectEnabled } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
      slug: nextSlug,
    },
    select: AGENT_DETAIL_SELECT,
  });

  await createActivityEvent({
    type: "AGENT_UPDATED",
    actorId: ownerId,
    targetAgentId: updated.id,
    metadata: {
      slug: updated.slug,
    },
  });

  if (existing.isPublished !== updated.isPublished && updated.isPublished) {
    await createActivityEvent({
      type: "AGENT_PUBLISHED",
      actorId: ownerId,
      targetAgentId: updated.id,
      metadata: {
        slug: updated.slug,
      },
    });
  }

  return updated;
}

export async function unpublishAgentBySlug(
  slug: string,
  ownerId: string,
): Promise<AgentDetail> {
  const existing = await db.agentProfile.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!existing) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (existing.ownerId !== ownerId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  const updated = await db.agentProfile.update({
    where: { id: existing.id },
    data: { isPublished: false },
    select: AGENT_DETAIL_SELECT,
  });

  await createActivityEvent({
    type: "AGENT_UPDATED",
    actorId: ownerId,
    targetAgentId: updated.id,
    metadata: {
      slug: updated.slug,
      action: "unpublish",
    },
  });

  return updated;
}
