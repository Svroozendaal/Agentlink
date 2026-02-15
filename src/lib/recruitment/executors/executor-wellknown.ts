import { contactViaRest } from "@/lib/recruitment/executors/executor-rest";
import type { ContactResult } from "@/lib/recruitment/types";
import { toObject } from "@/lib/recruitment/utils";

function readContactUrl(agentCard: unknown) {
  const root = toObject(agentCard);
  if (!root) {
    return null;
  }

  const direct = root.contact_url ?? root.message_url;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }

  const api = toObject(root.api);
  const baseUrl = api?.base_url;
  if (typeof baseUrl === "string" && baseUrl.trim().length > 0) {
    return `${baseUrl.replace(/\/$/, "")}/messages`;
  }

  return null;
}

export async function contactViaWellKnown(cardUrl: string, invitation: object): Promise<ContactResult> {
  try {
    const cardResponse = await fetch(cardUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AgentLink-Recruiter/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!cardResponse.ok) {
      return {
        success: false,
        sent: false,
        status: cardResponse.status,
        error: "No agent card found",
      };
    }

    const card = await cardResponse.json().catch(() => null);
    const contactUrl = readContactUrl(card);

    if (!contactUrl) {
      return {
        success: true,
        sent: false,
        status: 200,
        response: { agentCardData: card },
        note: "Agent card found but no contact endpoint was exposed",
      };
    }

    const result = await contactViaRest(contactUrl, invitation);
    return {
      ...result,
      response: {
        agentCardData: card,
        contactResponse: result.response,
      },
    };
  } catch (error) {
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : "Failed to fetch agent card",
    };
  }
}
