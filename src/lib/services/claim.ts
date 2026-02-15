import { ImportStatus, PricingModel } from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slugify";

function buildVerificationInstruction(input: {
  endpointUrl: string | null;
  websiteUrl: string | null;
  sourcePlatform: string;
}) {
  if (input.endpointUrl) {
    return {
      type: "endpoint",
      instructions:
        "Add a temporary header `X-AgentLink-Claim` with your user id and trigger verification.",
    };
  }

  if (input.websiteUrl) {
    return {
      type: "website",
      instructions:
        "Add a temporary text file at /.well-known/agentlink-claim.txt containing your user id.",
    };
  }

  if (input.sourcePlatform === "github") {
    return {
      type: "github",
      instructions:
        "Add `agentlink-claim:<your-user-id>` to your repository README and run verify.",
    };
  }

  return {
    type: "manual",
    instructions: "No automatic verification available. Request admin approval.",
  };
}

async function buildUniqueSlug(name: string) {
  const baseSlug = slugify(name);
  return ensureUniqueSlug(baseSlug, async (candidateSlug) => {
    const existing = await db.agentProfile.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    return Boolean(existing);
  });
}

export async function startClaim(importedAgentId: string, userId: string) {
  const [importedAgent, claimsToday] = await Promise.all([
    db.importedAgent.findUnique({
      where: { id: importedAgentId },
    }),
    db.importedAgent.count({
      where: {
        claimedByUserId: userId,
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1_000) },
      },
    }),
  ]);

  if (!importedAgent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Imported agent not found");
  }

  if (importedAgent.status !== ImportStatus.UNCLAIMED) {
    throw new AgentServiceError(400, "INVALID_STATE", "This listing is no longer claimable");
  }

  if (claimsToday >= 5) {
    throw new AgentServiceError(429, "RATE_LIMITED", "You can start at most 5 claim requests per day");
  }

  const updated = await db.importedAgent.update({
    where: { id: importedAgent.id },
    data: {
      status: ImportStatus.CLAIM_PENDING,
      claimedByUserId: userId,
    },
  });

  return {
    claimId: updated.id,
    verification: buildVerificationInstruction({
      endpointUrl: updated.endpointUrl,
      websiteUrl: updated.websiteUrl,
      sourcePlatform: updated.sourcePlatform,
    }),
  };
}

async function createProfileFromImport(importedAgentId: string, ownerId: string) {
  const importedAgent = await db.importedAgent.findUnique({
    where: { id: importedAgentId },
  });

  if (!importedAgent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Imported agent not found");
  }

  if (importedAgent.status !== ImportStatus.CLAIM_PENDING) {
    throw new AgentServiceError(400, "INVALID_STATE", "Claim has not been started");
  }

  const profileSlug = await buildUniqueSlug(importedAgent.name);
  const createdProfile = await db.agentProfile.create({
    data: {
      slug: profileSlug,
      name: importedAgent.name,
      description: importedAgent.description ?? "Imported listing",
      ownerId,
      skills: importedAgent.skills,
      category: importedAgent.category ?? "General",
      protocols: ["rest"],
      endpointUrl: importedAgent.endpointUrl,
      websiteUrl: importedAgent.websiteUrl,
      pricingModel: PricingModel.FREE,
      isPublished: true,
      isVerified: true,
      isEarlyAdopter: false,
    },
  });

  await db.importedAgent.update({
    where: { id: importedAgent.id },
    data: {
      status: ImportStatus.CLAIMED,
      claimedByUserId: ownerId,
      agentProfileId: createdProfile.id,
    },
  });

  await createActivityEvent({
    type: "AGENT_CLAIMED",
    actorId: ownerId,
    targetAgentId: createdProfile.id,
    metadata: {
      importedAgentId,
      sourcePlatform: importedAgent.sourcePlatform,
    },
  });

  return createdProfile;
}

export async function completeClaim(importedAgentId: string, userId: string) {
  const importedAgent = await db.importedAgent.findUnique({
    where: { id: importedAgentId },
    select: {
      claimedByUserId: true,
      status: true,
    },
  });

  if (!importedAgent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Imported agent not found");
  }

  if (importedAgent.claimedByUserId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "This claim belongs to another user");
  }

  return createProfileFromImport(importedAgentId, userId);
}

export async function adminApproveClaim(importedAgentId: string, adminUserId: string) {
  return createProfileFromImport(importedAgentId, adminUserId);
}

