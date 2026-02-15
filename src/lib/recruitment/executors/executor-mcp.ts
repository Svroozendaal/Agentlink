import { contactViaRest } from "@/lib/recruitment/executors/executor-rest";
import type { ContactResult } from "@/lib/recruitment/types";
import { toObject } from "@/lib/recruitment/utils";

function extractToolNames(payload: unknown) {
  const root = toObject(payload);
  const toolsValue = root?.tools ?? toObject(root?.data)?.tools;

  if (!Array.isArray(toolsValue)) {
    return [] as string[];
  }

  return toolsValue
    .map((tool) => toObject(tool)?.name)
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.toLowerCase());
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? { text } : null;
}

export async function contactViaMcp(endpointUrl: string, invitation: object): Promise<ContactResult> {
  try {
    const listingResponse = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AgentLink-Recruiter/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });

    const listingPayload = listingResponse.ok ? await readResponseBody(listingResponse) : null;
    const tools = extractToolNames(listingPayload);
    const preferredTool = tools.find((tool) =>
      ["receive_message", "contact", "contact_agent", "inbox.receive"].includes(tool),
    );

    if (!preferredTool) {
      return contactViaRest(endpointUrl, invitation);
    }

    const callResponse = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AgentLink-Recruiter/1.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: preferredTool,
          arguments: {
            message: invitation,
            source: "agentlink-recruiter",
          },
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    return {
      success: callResponse.ok,
      sent: true,
      status: callResponse.status,
      response: await readResponseBody(callResponse),
    };
  } catch {
    return contactViaRest(endpointUrl, invitation);
  }
}
