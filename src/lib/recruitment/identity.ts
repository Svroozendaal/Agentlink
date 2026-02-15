import { Role } from "@prisma/client";

import { generateApiKey } from "@/lib/auth/api-keys";
import { db } from "@/lib/db";

export const RECRUITER_AGENT = {
  name: "AgentLink Recruiter",
  slug: "agentlink-recruiter",
  description:
    "I am the official AgentLink recruitment agent. I discover AI agents across the web and invite them to join the AgentLink registry.",
  longDescription:
    "AgentLink Recruiter performs protocol-native outreach to publicly discoverable AI agents and invites them to register on AgentLink.",
  skills: ["agent-discovery", "recruitment", "networking"],
  protocols: ["rest", "a2a", "mcp"],
  tags: ["system", "growth"],
  category: "Platform",
} as const;

const RECRUITER_API_KEY_NAME = "AgentLink Recruiter (system)";

export interface RecruiterIdentity {
  userId: string;
  agentId: string;
  apiKeyId: string;
  createdApiKey?: string;
}

export async function ensureRecruiterIdentity(): Promise<RecruiterIdentity> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  let user = adminEmail
    ? await db.user.findUnique({ where: { email: adminEmail } })
    : await db.user.findFirst({ where: { role: Role.ADMIN }, orderBy: { createdAt: "asc" } });

  if (!user) {
    user = await db.user.create({
      data: {
        email: adminEmail ?? "recruiter@agent-l.ink",
        name: "AgentLink System",
        role: Role.ADMIN,
      },
    });
  } else if (user.role !== Role.ADMIN) {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: Role.ADMIN },
    });
  }

  const agent = await db.agentProfile.upsert({
    where: { slug: RECRUITER_AGENT.slug },
    update: {
      name: RECRUITER_AGENT.name,
      description: RECRUITER_AGENT.description,
      longDescription: RECRUITER_AGENT.longDescription,
      ownerId: user.id,
      skills: [...RECRUITER_AGENT.skills],
      tags: [...RECRUITER_AGENT.tags],
      category: RECRUITER_AGENT.category,
      protocols: [...RECRUITER_AGENT.protocols],
      isPublished: true,
      isVerified: true,
      acceptsMessages: false,
      playgroundEnabled: false,
      connectEnabled: true,
    },
    create: {
      slug: RECRUITER_AGENT.slug,
      name: RECRUITER_AGENT.name,
      description: RECRUITER_AGENT.description,
      longDescription: RECRUITER_AGENT.longDescription,
      ownerId: user.id,
      skills: [...RECRUITER_AGENT.skills],
      tags: [...RECRUITER_AGENT.tags],
      category: RECRUITER_AGENT.category,
      protocols: [...RECRUITER_AGENT.protocols],
      pricingModel: "FREE",
      isPublished: true,
      isVerified: true,
      acceptsMessages: false,
      playgroundEnabled: false,
      connectEnabled: true,
      isEarlyAdopter: true,
    },
    select: {
      id: true,
    },
  });

  const existingApiKey = await db.apiKey.findFirst({
    where: {
      userId: user.id,
      name: RECRUITER_API_KEY_NAME,
      isActive: true,
    },
    select: { id: true },
  });

  if (existingApiKey) {
    return {
      userId: user.id,
      agentId: agent.id,
      apiKeyId: existingApiKey.id,
    };
  }

  const created = await generateApiKey({
    userId: user.id,
    name: RECRUITER_API_KEY_NAME,
    scopes: ["agents:read", "agents:write", "recruitment:write"],
  });

  return {
    userId: user.id,
    agentId: agent.id,
    apiKeyId: created.id,
    createdApiKey: created.key,
  };
}

