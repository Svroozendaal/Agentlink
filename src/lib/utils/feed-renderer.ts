import { ActivityType } from "@prisma/client";

interface RenderableActor {
  id: string;
  name: string | null;
}

interface RenderableAgent {
  id: string;
  slug: string;
  name: string;
}

export interface RenderableActivityEvent {
  id: string;
  type: ActivityType;
  metadata: unknown;
  createdAt: Date;
  actor: RenderableActor | null;
  actorAgent: RenderableAgent | null;
  targetAgent: RenderableAgent | null;
}

export interface FeedItem {
  id: string;
  type: ActivityType;
  icon: string;
  text: string;
  link: string | null;
  timestamp: Date;
}

function readMetadataNumber(metadata: unknown, key: string): number | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function readMetadataString(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function actorName(event: RenderableActivityEvent): string {
  if (event.actorAgent?.name) {
    return event.actorAgent.name;
  }

  if (event.actor?.name) {
    return event.actor.name;
  }

  return "A user";
}

function targetName(event: RenderableActivityEvent): string {
  return event.targetAgent?.name ?? "this agent";
}

function targetLink(event: RenderableActivityEvent): string | null {
  return event.targetAgent ? `/agents/${event.targetAgent.slug}` : null;
}

export function renderActivityEvent(event: RenderableActivityEvent): FeedItem {
  switch (event.type) {
    case ActivityType.REVIEW_POSTED: {
      const rating = readMetadataNumber(event.metadata, "rating");
      const label = rating ? `${rating}/5` : "a review";

      return {
        id: event.id,
        type: event.type,
        icon: "review",
        text: `${actorName(event)} posted ${label} for ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    }
    case ActivityType.REVIEW_UPDATED:
      return {
        id: event.id,
        type: event.type,
        icon: "edit",
        text: `${actorName(event)} updated a review for ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.ENDORSEMENT_GIVEN: {
      const skill = readMetadataString(event.metadata, "skill") ?? "a skill";

      return {
        id: event.id,
        type: event.type,
        icon: "endorsement",
        text: `${actorName(event)} endorsed ${skill} for ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    }
    case ActivityType.AGENT_CREATED:
    case ActivityType.AGENT_REGISTERED_VIA_API:
      return {
        id: event.id,
        type: event.type,
        icon: "agent",
        text: `${targetName(event)} was added to AgentLink`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.AGENT_PUBLISHED:
      return {
        id: event.id,
        type: event.type,
        icon: "publish",
        text: `${targetName(event)} was published`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.AGENT_VERIFIED:
      return {
        id: event.id,
        type: event.type,
        icon: "verified",
        text: `${targetName(event)} was verified`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.AGENT_CONNECTED:
      return {
        id: event.id,
        type: event.type,
        icon: "connect",
        text: `${actorName(event)} sent a connect request to ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.AGENT_CLAIMED:
      return {
        id: event.id,
        type: event.type,
        icon: "claim",
        text: `${actorName(event)} claimed ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.CONVERSATION_STARTED:
      return {
        id: event.id,
        type: event.type,
        icon: "conversation",
        text: `${actorName(event)} started a conversation with ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.MESSAGE_SENT:
      return {
        id: event.id,
        type: event.type,
        icon: "message",
        text: `${actorName(event)} sent a message in a conversation with ${targetName(event)}`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
    case ActivityType.AGENT_UPDATED:
    default:
      return {
        id: event.id,
        type: event.type,
        icon: "update",
        text: `${targetName(event)} was updated`,
        link: targetLink(event),
        timestamp: event.createdAt,
      };
  }
}
