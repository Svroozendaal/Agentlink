import {
  ActivityType,
  ConversationStatus,
  ConversationType,
  MessageContentType,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { createActivityEvent } from "@/lib/services/activity";
import { AgentServiceError } from "@/lib/services/agents";
import { triggerAgentWebhooks } from "@/lib/services/webhooks";
import type {
  ListConversationsQueryInput,
  ListMessagesQueryInput,
  SendMessageInput,
  StartConversationInput,
  UpdateConversationInput,
} from "@/lib/validations/messaging";

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  content: true,
  contentType: true,
  metadata: true,
  isRead: true,
  createdAt: true,
  senderAgent: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} satisfies Prisma.MessageSelect;

const CONVERSATION_SELECT = {
  id: true,
  type: true,
  status: true,
  subject: true,
  metadata: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  initiator: {
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
    },
  },
  receiver: {
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
    },
  },
  messages: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: MESSAGE_SELECT,
  },
} satisfies Prisma.ConversationSelect;

type SelectedConversation = Prisma.ConversationGetPayload<{ select: typeof CONVERSATION_SELECT }>;

export type ConversationMessage = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

export interface ConversationListItem {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  subject: string | null;
  metadata: Prisma.JsonValue;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  otherAgent: {
    id: string;
    slug: string;
    name: string;
  };
  lastMessage: ConversationMessage | null;
  unreadCount: number;
}

export interface ConversationListResult {
  conversations: ConversationListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConversationMessagesResult {
  messages: ConversationMessage[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

function toJsonInput(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

function assertReceivesMessages(
  receiver: { acceptsMessages: boolean },
  senderId: string,
  receiverOwnerId: string,
) {
  if (!receiver.acceptsMessages && senderId !== receiverOwnerId) {
    throw new AgentServiceError(403, "MESSAGING_DISABLED", "Receiver does not accept messages");
  }
}

async function resolveOwnedAgentBySlug(userId: string, slug: string) {
  const agent = await db.agentProfile.findFirst({
    where: {
      slug,
      ownerId: userId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      isPublished: true,
      acceptsMessages: true,
    },
  });

  if (!agent) {
    throw new AgentServiceError(403, "FORBIDDEN", "Sender agent is not owned by current user");
  }

  return agent;
}

async function resolveReceiverBySlug(slug: string) {
  const receiver = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      isPublished: true,
      acceptsMessages: true,
    },
  });

  if (!receiver) {
    throw new AgentServiceError(404, "NOT_FOUND", "Receiver agent not found");
  }

  if (!receiver.isPublished) {
    throw new AgentServiceError(403, "FORBIDDEN", "Cannot message unpublished agents");
  }

  return receiver;
}

function mapConversation(
  conversation: SelectedConversation,
  currentAgentId: string,
  unreadCount: number,
): ConversationListItem {
  const otherAgent = conversation.initiator.id === currentAgentId
    ? conversation.receiver
    : conversation.initiator;

  return {
    id: conversation.id,
    type: conversation.type,
    status: conversation.status,
    subject: conversation.subject,
    metadata: conversation.metadata,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    otherAgent: {
      id: otherAgent.id,
      slug: otherAgent.slug,
      name: otherAgent.name,
    },
    lastMessage: conversation.messages[0] ?? null,
    unreadCount,
  };
}

async function resolveConversationForUser(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      status: true,
      initiatorId: true,
      receiverId: true,
      initiator: {
        select: {
          id: true,
          ownerId: true,
          slug: true,
        },
      },
      receiver: {
        select: {
          id: true,
          ownerId: true,
          slug: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new AgentServiceError(404, "NOT_FOUND", "Conversation not found");
  }

  const ownedParticipants = [conversation.initiator, conversation.receiver].filter(
    (agent) => agent.ownerId === userId,
  );

  if (ownedParticipants.length === 0) {
    throw new AgentServiceError(403, "FORBIDDEN", "Not a participant in this conversation");
  }

  return {
    conversation,
    ownedParticipants,
  };
}

function resolveParticipantAgentId(
  ownedParticipants: Array<{ id: string; slug: string }>,
  requestedSlug?: string,
): string {
  if (requestedSlug) {
    const matching = ownedParticipants.find((agent) => agent.slug === requestedSlug);

    if (!matching) {
      throw new AgentServiceError(403, "FORBIDDEN", "Requested agent is not a participant");
    }

    return matching.id;
  }

  if (ownedParticipants.length > 1) {
    throw new AgentServiceError(
      400,
      "AMBIGUOUS_AGENT",
      "Provide agentSlug when you own multiple agents in this conversation",
    );
  }

  return ownedParticipants[0]!.id;
}

export async function startConversation(
  receiverSlug: string,
  userId: string,
  input: StartConversationInput,
) {
  const [senderAgent, receiverAgent] = await Promise.all([
    resolveOwnedAgentBySlug(userId, input.senderAgentSlug),
    resolveReceiverBySlug(receiverSlug),
  ]);

  if (senderAgent.id === receiverAgent.id) {
    throw new AgentServiceError(400, "INVALID_REQUEST", "Cannot start a conversation with yourself");
  }

  assertReceivesMessages(receiverAgent, userId, receiverAgent.ownerId);

  const now = new Date();

  const existingConversation = await db.conversation.findFirst({
    where: {
      status: ConversationStatus.OPEN,
      OR: [
        {
          initiatorId: senderAgent.id,
          receiverId: receiverAgent.id,
        },
        {
          initiatorId: receiverAgent.id,
          receiverId: senderAgent.id,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const result = await db.$transaction(async (tx) => {
    if (existingConversation) {
      const message = await tx.message.create({
        data: {
          conversationId: existingConversation.id,
          senderAgentId: senderAgent.id,
          content: input.message,
          contentType: input.contentType,
          metadata: toJsonInput(input.metadata),
        },
        select: MESSAGE_SELECT,
      });

      const conversation = await tx.conversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: now,
        },
        select: CONVERSATION_SELECT,
      });

      return {
        conversation,
        message,
        createdConversation: false,
      };
    }

    const conversation = await tx.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        status: ConversationStatus.OPEN,
        subject: input.subject,
        metadata: toJsonInput(input.metadata),
        initiatorId: senderAgent.id,
        receiverId: receiverAgent.id,
        lastMessageAt: now,
      },
      select: CONVERSATION_SELECT,
    });

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderAgentId: senderAgent.id,
        content: input.message,
        contentType: input.contentType,
        metadata: toJsonInput(input.metadata),
      },
      select: MESSAGE_SELECT,
    });

    return {
      conversation,
      message,
      createdConversation: true,
    };
  });

  if (result.createdConversation) {
    void triggerAgentWebhooks(receiverAgent.id, "conversation.started", {
      conversationId: result.conversation.id,
      initiatorAgentId: senderAgent.id,
      initiatorAgentSlug: senderAgent.slug,
      receiverAgentId: receiverAgent.id,
      receiverAgentSlug: receiverAgent.slug,
    });

    await createActivityEvent({
      type: ActivityType.CONVERSATION_STARTED,
      actorId: userId,
      actorAgentId: senderAgent.id,
      targetAgentId: receiverAgent.id,
      metadata: {
        conversationId: result.conversation.id,
      },
    });
  }

  void triggerAgentWebhooks(receiverAgent.id, "message.received", {
    conversationId: result.conversation.id,
    messageId: result.message.id,
    fromAgentId: senderAgent.id,
    fromAgentSlug: senderAgent.slug,
  });

  await createActivityEvent({
    type: ActivityType.MESSAGE_SENT,
    actorId: userId,
    actorAgentId: senderAgent.id,
    targetAgentId: receiverAgent.id,
    metadata: {
      conversationId: result.conversation.id,
      messageId: result.message.id,
    },
  });

  return result;
}

export async function sendConversationMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput,
) {
  const senderAgent = await resolveOwnedAgentBySlug(userId, input.senderAgentSlug);

  const conversation = await db.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      status: true,
      initiatorId: true,
      receiverId: true,
    },
  });

  if (!conversation) {
    throw new AgentServiceError(404, "NOT_FOUND", "Conversation not found");
  }

  if (conversation.status !== ConversationStatus.OPEN) {
    throw new AgentServiceError(409, "CONVERSATION_CLOSED", "Conversation is not open");
  }

  const isParticipant =
    senderAgent.id === conversation.initiatorId || senderAgent.id === conversation.receiverId;

  if (!isParticipant) {
    throw new AgentServiceError(403, "FORBIDDEN", "Sender is not part of this conversation");
  }

  const message = await db.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderAgentId: senderAgent.id,
        content: input.content,
        contentType: input.contentType ?? MessageContentType.TEXT,
        metadata: toJsonInput(input.metadata),
      },
      select: MESSAGE_SELECT,
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: createdMessage.createdAt,
      },
    });

    return createdMessage;
  });

  const receiverAgentId =
    senderAgent.id === conversation.initiatorId
      ? conversation.receiverId
      : conversation.initiatorId;

  void triggerAgentWebhooks(receiverAgentId, "message.received", {
    conversationId: conversation.id,
    messageId: message.id,
    fromAgentId: senderAgent.id,
    fromAgentSlug: senderAgent.slug,
  });

  await createActivityEvent({
    type: ActivityType.MESSAGE_SENT,
    actorId: userId,
    actorAgentId: senderAgent.id,
    targetAgentId: receiverAgentId,
    metadata: {
      conversationId: conversation.id,
      messageId: message.id,
    },
  });

  return message;
}

export async function listAgentConversations(
  slug: string,
  userId: string,
  query: ListConversationsQueryInput,
): Promise<ConversationListResult> {
  const agent = await resolveOwnedAgentBySlug(userId, slug);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Prisma.ConversationWhereInput = {
    OR: [{ initiatorId: agent.id }, { receiverId: agent.id }],
    ...(query.status !== "all"
      ? {
          status: query.status.toUpperCase() as ConversationStatus,
        }
      : {}),
  };

  const [rows, total] = await db.$transaction([
    db.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      select: CONVERSATION_SELECT,
    }),
    db.conversation.count({ where }),
  ]);

  const conversationIds = rows.map((row) => row.id);

  const unreadCounts = conversationIds.length
    ? await db.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: conversationIds },
          senderAgentId: { not: agent.id },
          isRead: false,
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const unreadByConversationId = new Map(
    unreadCounts.map((item) => [item.conversationId, item._count._all]),
  );

  return {
    conversations: rows.map((conversation) =>
      mapConversation(conversation, agent.id, unreadByConversationId.get(conversation.id) ?? 0),
    ),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  query: ListMessagesQueryInput,
): Promise<ConversationMessagesResult> {
  const { conversation, ownedParticipants } = await resolveConversationForUser(conversationId, userId);
  const participantAgentId = resolveParticipantAgentId(ownedParticipants, query.agentSlug);

  const rows = await db.message.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : 0,
    take: query.limit + 1,
    select: MESSAGE_SELECT,
  });

  const hasMore = rows.length > query.limit;
  const messages = hasMore ? rows.slice(0, query.limit) : rows;
  const nextCursor = hasMore ? messages[messages.length - 1]?.id ?? null : null;

  await db.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderAgentId: { not: participantAgentId },
      isRead: false,
      id: { in: messages.map((message) => message.id) },
    },
    data: {
      isRead: true,
    },
  });

  return {
    messages,
    meta: {
      hasMore,
      nextCursor,
    },
  };
}

export async function updateConversationStatus(
  conversationId: string,
  userId: string,
  input: UpdateConversationInput,
) {
  const { conversation, ownedParticipants } = await resolveConversationForUser(conversationId, userId);

  if (ownedParticipants.length === 0) {
    throw new AgentServiceError(403, "FORBIDDEN", "Not a participant in this conversation");
  }

  return db.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      status: input.status,
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function getUnreadCountByAgentSlug(slug: string, userId: string): Promise<number> {
  const agent = await resolveOwnedAgentBySlug(userId, slug);

  return db.message.count({
    where: {
      isRead: false,
      senderAgentId: {
        not: agent.id,
      },
      conversation: {
        status: ConversationStatus.OPEN,
        OR: [{ initiatorId: agent.id }, { receiverId: agent.id }],
      },
    },
  });
}
