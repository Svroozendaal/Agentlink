import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "message.received",
  "conversation.started",
  "review.posted",
  "endorsement.given",
  "agent.verified",
  "connect.request",
  "agent.discovered",
] as const;

const WebhookEventSchema = z.enum(WEBHOOK_EVENTS);

function isHttpsOrLocalhost(url: URL): boolean {
  if (url.protocol === "https:") {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".local")
    );
  }

  return false;
}

export const RegisterWebhookSchema = z.object({
  url: z
    .string()
    .url()
    .superRefine((value, ctx) => {
      const parsed = new URL(value);

      if (!isHttpsOrLocalhost(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Webhook URL must use HTTPS (HTTP only allowed for localhost in development)",
        });
      }
    }),
  events: z.array(WebhookEventSchema).min(1).max(10),
});

export const WebhookIdParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

export type RegisterWebhookInput = z.infer<typeof RegisterWebhookSchema>;
export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];
