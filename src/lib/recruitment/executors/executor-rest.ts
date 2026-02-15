import type { ContactResult } from "@/lib/recruitment/types";
import { stringifyUnknown } from "@/lib/recruitment/utils";

function detectInterest(value: unknown) {
  const payload = stringifyUnknown(value).toLowerCase();
  return payload.includes("registered") || payload.includes("accepted") || payload.includes("thanks");
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? { text } : null;
}

export async function contactViaRest(targetUrl: string, invitation: object): Promise<ContactResult> {
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AgentLink-Recruiter/1.0",
        "X-AgentLink-Type": "invitation",
      },
      body: JSON.stringify(invitation),
      signal: AbortSignal.timeout(15_000),
    });

    const responseBody = await readResponseBody(response);

    return {
      success: response.ok,
      sent: true,
      status: response.status,
      response: responseBody,
      interested: detectInterest(responseBody),
    };
  } catch (error) {
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}
