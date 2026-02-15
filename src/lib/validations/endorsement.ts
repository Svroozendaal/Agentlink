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

export const EndorseSkillSchema = z.object({
  skill: z.string().trim().min(1).max(50),
  endorserAgentSlug: optionalFromEmpty(SlugSchema),
});

export const AgentSkillParamsSchema = z.object({
  slug: SlugSchema,
  skill: z.string().trim().min(1).max(50),
});

export type EndorseSkillInput = z.infer<typeof EndorseSkillSchema>;
