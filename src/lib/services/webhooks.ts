import { createHmac, randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import type { RegisterWebhookInput, WebhookEventType } from "@/lib/validations/webhook";

const MAX_WEBHOOKS_PER_AGENT = 5;
const WEBHOOK_FAIL_THRESHOLD = 10;
const WEBHOOK_TIMEOUT_MS = 10_000;

const WEBHOOK_SELECT = {
  id: true,
  url: true,
  events: true,
  isActive: true,
  lastCalledAt: true,
  failCount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WebhookSelect;

export type AgentWebhook = Prisma.WebhookGetPayload<{ select: typeof WEBHOOK_SELECT }>;

async function resolveOwnedAgent(slug: string, userId: string) {
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!agent) {
    throw new AgentServiceError(404, "NOT_FOUND", "Agent not found");
  }

  if (agent.ownerId !== userId) {
    throw new AgentServiceError(403, "FORBIDDEN", "You do not own this agent");
  }

  return agent;
}

function buildWebhookPayload(event: WebhookEventType, payload: Record<string, unknown>) {
  return {
    event,
    timestamp: new Date().toISOString(),
    payload,
  };
}

function signPayload(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${signature}`;
}

async function postWebhook(url: string, event: WebhookEventType, body: string, secret: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AgentLink-Event": event,
        "X-AgentLink-Signature": signPayload(body, secret),
      },
      body,
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function registerAgentWebhook(
  slug: string,
  userId: string,
  input: RegisterWebhookInput,
) {
  const agent = await resolveOwnedAgent(slug, userId);

  const existingCount = await db.webhook.count({
    where: {
      agentId: agent.id,
    },
  });

  if (existingCount >= MAX_WEBHOOKS_PER_AGENT) {
    throw new AgentServiceError(400, "WEBHOOK_LIMIT", "Maximum number of webhooks reached");
  }

  const secret = randomBytes(32).toString("hex");

  try {
    const webhook = await db.webhook.create({
      data: {
        agentId: agent.id,
        url: input.url,
        secret,
        events: input.events,
      },
      select: WEBHOOK_SELECT,
    });

    return {
      ...webhook,
      secret,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AgentServiceError(409, "DUPLICATE_WEBHOOK", "Webhook URL already registered");
    }

    throw error;
  }
}

export async function listAgentWebhooks(slug: string, userId: string) {
  const agent = await resolveOwnedAgent(slug, userId);

  const webhooks = await db.webhook.findMany({
    where: {
      agentId: agent.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      ...WEBHOOK_SELECT,
      secret: true,
    },
  });

  return webhooks.map((webhook) => ({
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.isActive,
    lastCalledAt: webhook.lastCalledAt,
    failCount: webhook.failCount,
    secretPrefix: webhook.secret.slice(0, 8),
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
  }));
}

export async function deleteAgentWebhook(slug: string, webhookId: string, userId: string) {
  const agent = await resolveOwnedAgent(slug, userId);

  const deleted = await db.webhook.deleteMany({
    where: {
      id: webhookId,
      agentId: agent.id,
    },
  });

  if (deleted.count === 0) {
    throw new AgentServiceError(404, "NOT_FOUND", "Webhook not found");
  }

  return {
    removed: true,
  };
}

export async function triggerAgentWebhooks(
  agentId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: {
      agentId,
      isActive: true,
      events: {
        has: event,
      },
    },
    select: {
      id: true,
      url: true,
      secret: true,
      failCount: true,
    },
  });

  const bodyObject = buildWebhookPayload(event, payload);
  const body = JSON.stringify(bodyObject);

  await Promise.all(
    webhooks.map(async (webhook) => {
      const success = await postWebhook(webhook.url, event, body, webhook.secret);

      if (success) {
        await db.webhook.update({
          where: { id: webhook.id },
          data: {
            failCount: 0,
            lastCalledAt: new Date(),
          },
        });
        return;
      }

      const nextFailCount = webhook.failCount + 1;

      await db.webhook.update({
        where: { id: webhook.id },
        data: {
          failCount: nextFailCount,
          isActive: nextFailCount < WEBHOOK_FAIL_THRESHOLD,
        },
      });
    }),
  );
}
