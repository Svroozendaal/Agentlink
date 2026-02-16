import type { ContactResult } from "@/lib/recruitment/types";

interface EmailPayload {
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

function normalizeRecipients(recipientOrDomain: string, payloadTo?: string | string[]) {
  if (Array.isArray(payloadTo)) {
    return payloadTo
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.includes("@"));
  }

  if (typeof payloadTo === "string") {
    return payloadTo
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.includes("@"));
  }

  const trimmed = recipientOrDomain.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return [trimmed];
  }

  return [];
}

export async function contactViaEmailApi(
  recipientOrDomain: string,
  payload: object,
): Promise<ContactResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return {
      success: false,
      sent: false,
      error: "RESEND_API_KEY is missing",
    };
  }

  const parsedPayload = payload as EmailPayload;
  const to = normalizeRecipients(recipientOrDomain, parsedPayload.to);
  if (to.length === 0) {
    return {
      success: false,
      sent: false,
      error: "No valid email recipient provided",
    };
  }

  const from =
    parsedPayload.from?.trim() ||
    process.env.OUTREACH_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    return {
      success: false,
      sent: false,
      error: "OUTREACH_FROM_EMAIL is missing",
    };
  }

  const subject = parsedPayload.subject?.trim() || "AgentLink invitation";
  const text = parsedPayload.text?.trim() || "";
  const html = parsedPayload.html?.trim() || `<p>${text.replace(/\n/g, "<br/>")}</p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: text.length > 0 ? text : undefined,
        html,
        reply_to: parsedPayload.replyTo?.trim() || undefined,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const responseBody = await response.json().catch(() => null);
    return {
      success: response.ok,
      sent: response.ok,
      status: response.status,
      response: responseBody,
      error:
        response.ok
          ? undefined
          : typeof responseBody === "object" && responseBody && "message" in responseBody
            ? String((responseBody as { message: string }).message)
            : "Failed to send email via Resend",
    };
  } catch (error) {
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : "Email request failed",
    };
  }
}
