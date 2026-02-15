import type { ContactResult } from "@/lib/recruitment/types";

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? { text } : null;
}

export async function contactViaA2A(endpointUrl: string, message: object): Promise<ContactResult> {
  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AgentLink-Recruiter/1.0",
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000),
    });

    return {
      success: response.ok,
      sent: true,
      status: response.status,
      response: await readResponseBody(response),
    };
  } catch (error) {
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}
