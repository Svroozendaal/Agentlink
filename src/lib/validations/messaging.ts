import { ConversationStatus, MessageContentType } from "@prisma/client";
import { z } from "zod";

function optionalFromEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal(""), z.undefined()])
    .transform((value) => (value === "" ? undefined : value));
}

const SlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

const StatusSchema = z
  .enum(["open", "closed", "archived", "all"])
  .default("open");

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const StartConversationSchema = z.object({
  senderAgentSlug: SlugSchema,
  subject: optionalFromEmpty(z.string().trim().max(200)),
  message: z.string().trim().min(1).max(5000),
  contentType: z.nativeEnum(MessageContentType).optional().default(MessageContentType.TEXT),
  metadata: JsonRecordSchema.optional(),
});

export const SendMessageSchema = z.object({
  senderAgentSlug: SlugSchema,
  content: z.string().trim().min(1).max(5000),
  contentType: z.nativeEnum(MessageContentType).optional().default(MessageContentType.TEXT),
  metadata: JsonRecordSchema.optional(),
});

export const ListConversationsQuerySchema = z.object({
  status: StatusSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const ListMessagesQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  agentSlug: SlugSchema.optional(),
});

export const ConversationIdParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

export const UpdateConversationSchema = z.object({
  status: z
    .enum(["closed", "archived", "CLOSED", "ARCHIVED"])
    .transform((value) => value.toUpperCase() as ConversationStatus),
});

export type StartConversationInput = z.infer<typeof StartConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type ListConversationsQueryInput = z.infer<typeof ListConversationsQuerySchema>;
export type ListMessagesQueryInput = z.infer<typeof ListMessagesQuerySchema>;
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>;
