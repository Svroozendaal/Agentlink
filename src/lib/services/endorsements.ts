import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import type { EndorseSkillInput } from "@/lib/validations/endorsement";

const ENDORSEMENT_SELECT = {
  id: true,
  skill: true,
  createdAt: true,
  endorser: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  endorserAgent: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} satisfies Prisma.EndorsementSelect;

export type EndorsementItem = Prisma.EndorsementGetPayload<{ select: typeof ENDORSEMENT_SELECT }>;

export interface SkillEndorsementGroup {
  skill: string;
  count: number;
  endorsers: Array<{
    id: string;
    name: string | null;
    image: string | null;
    agent: {
      id: string;
      slug: string;
      name: string;
    } | null;
  }>;
}

export interface AgentEndorsementsResult {
  skills: SkillEndorsementGroup[];
  endorsementCount: number;
}

export interface TopEndorsedSkill {
  skill: string;
  count: number;
}

function normalizeSkill(input: string): string {
  return input.trim().toLowerCase();
}

async function recalculateEndorsementCount(agentId: string): Promise<number> {
  const count = await db.endorsement.count({
    where: { agentId },
  });

  await db.agentProfile.update({
    where: { id: agentId },
    data: { endorsementCount: count },
  });

  return count;
}

async function resolveVisibleAgentBySlug(slug: string, viewerUserId?: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      isPublished: true,
      skills: true,
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

export async function endorseSkillBySlug(
  slug: string,
  userId: string,
  input: EndorseSkillInput,
): Promise<EndorsementItem> {
  const agent = await resolveVisibleAgentBySlug(slug, userId);

  if (!agent.isPublished) {
    throw new AgentServiceError(403, "FORBIDDEN", "Cannot endorse unpublished agent");
  }

  if (agent.ownerId === userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "Self-endorsement is not allowed");
  }

  const normalizedRequestedSkill = normalizeSkill(input.skill);
  const matchedSkill = agent.skills.find(
    (skill) => normalizeSkill(skill) === normalizedRequestedSkill,
  );

  if (!matchedSkill) {
    throw new AgentServiceError(400, "INVALID_SKILL", "Skill is not part of the agent profile");
  }

  let endorserAgentId: string | undefined;

  if (input.endorserAgentSlug) {
    const ownedAgent = await db.agentProfile.findFirst({
      where: {
        slug: input.endorserAgentSlug,
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!ownedAgent) {
      throw new AgentServiceError(403, "FORBIDDEN", "Endorser agent is not owned by current user");
    }

    if (ownedAgent.id === agent.id) {
      throw new AgentServiceError(403, "FORBIDDEN", "Self-endorsement is not allowed");
    }

    endorserAgentId = ownedAgent.id;
  }

  try {
    const endorsement = await db.endorsement.create({
      data: {
        agentId: agent.id,
        skill: matchedSkill,
        endorserId: userId,
        endorserAgentId,
      },
      select: ENDORSEMENT_SELECT,
    });

    await Promise.all([
      recalculateEndorsementCount(agent.id),
      createActivityEvent({
        type: "ENDORSEMENT_GIVEN",
        actorId: userId,
        actorAgentId: endorserAgentId,
        targetAgentId: agent.id,
        metadata: {
          skill: matchedSkill,
        },
      }),
    ]);

    return endorsement;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AgentServiceError(409, "DUPLICATE_ENDORSEMENT", "Skill already endorsed");
    }

    throw error;
  }
}

export async function removeEndorsementBySlug(
  slug: string,
  skill: string,
  userId: string,
): Promise<{ removed: true }> {
  const agent = await resolveVisibleAgentBySlug(slug, userId);

  const existing = await db.endorsement.findFirst({
    where: {
      agentId: agent.id,
      endorserId: userId,
      skill: {
        equals: skill,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new AgentServiceError(404, "NOT_FOUND", "Endorsement not found");
  }

  await db.endorsement.delete({
    where: { id: existing.id },
  });

  await recalculateEndorsementCount(agent.id);

  return { removed: true };
}

export async function listEndorsementsBySlug(
  slug: string,
  viewerUserId?: string,
): Promise<AgentEndorsementsResult> {
  const agent = await resolveVisibleAgentBySlug(slug, viewerUserId);

  const endorsements = await db.endorsement.findMany({
    where: {
      agentId: agent.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    select: ENDORSEMENT_SELECT,
  });

  const groups = new Map<string, SkillEndorsementGroup>();

  for (const endorsement of endorsements) {
    if (!groups.has(endorsement.skill)) {
      groups.set(endorsement.skill, {
        skill: endorsement.skill,
        count: 0,
        endorsers: [],
      });
    }

    const current = groups.get(endorsement.skill)!;
    current.count += 1;
    current.endorsers.push({
      id: endorsement.endorser.id,
      name: endorsement.endorser.name,
      image: endorsement.endorser.image,
      agent: endorsement.endorserAgent
        ? {
            id: endorsement.endorserAgent.id,
            slug: endorsement.endorserAgent.slug,
            name: endorsement.endorserAgent.name,
          }
        : null,
    });
  }

  const skills = Array.from(groups.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.skill.localeCompare(b.skill);
  });

  return {
    skills,
    endorsementCount: endorsements.length,
  };
}

export async function getTopEndorsedSkills(
  agentId: string,
  limit = 3,
): Promise<TopEndorsedSkill[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20));

  const grouped = await db.endorsement.groupBy({
    by: ["skill"],
    where: { agentId },
    _count: { _all: true },
    orderBy: {
      _count: {
        skill: "desc",
      },
    },
    take: safeLimit,
  });

  return grouped.map((item) => ({
    skill: item.skill,
    count: item._count._all,
  }));
}
