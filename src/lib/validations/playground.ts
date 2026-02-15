import { z } from "zod";

export const PlaygroundRequestSchema = z.object({
  endpointId: z.string().trim().min(2).max(120).optional(),
  body: z.record(z.string(), z.unknown()),
});

export type PlaygroundRequestInput = z.infer<typeof PlaygroundRequestSchema>;

