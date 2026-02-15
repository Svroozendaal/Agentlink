import { z } from "zod";

export const ConnectRequestSchema = z.object({
  fromAgentSlug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  body: z.record(z.string(), z.unknown()),
  endpointId: z.string().trim().min(2).max(120).optional(),
});

export const ConnectLogQuerySchema = z.object({
  direction: z.enum(["sent", "received", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ConnectRequestInput = z.infer<typeof ConnectRequestSchema>;
export type ConnectLogQueryInput = z.infer<typeof ConnectLogQuerySchema>;

