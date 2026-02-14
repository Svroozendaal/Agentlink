import { PricingModel } from "@prisma/client";
import { z } from "zod";

const ProtocolSchema = z.enum(["a2a", "rest", "mcp"]);

const NameSchema = z.string().trim().min(2).max(100);
const DescriptionSchema = z.string().trim().min(10).max(280);
const LongDescriptionSchema = z.string().trim().min(20).max(5000);
const StringTagSchema = z.string().trim().min(1).max(40);
const UrlSchema = z.string().url();

function optionalFromEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal(""), z.undefined()])
    .transform((value) => (value === "" ? undefined : value));
}

function parseCommaSeparated(input?: string): string[] | undefined {
  if (!input) {
    return undefined;
  }

  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return undefined;
  }

  return Array.from(new Set(parts));
}

function parseBooleanInput(input: unknown): boolean | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  if (typeof input === "boolean") {
    return input;
  }

  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return input as never;
}

export const CreateAgentSchema = z.object({
  name: NameSchema,
  description: DescriptionSchema,
  longDescription: optionalFromEmpty(LongDescriptionSchema),
  skills: z.array(StringTagSchema).min(1).max(20),
  tags: z.array(StringTagSchema).max(20).optional().default([]),
  category: z.string().trim().min(2).max(60).optional().default("General"),
  protocols: z.array(ProtocolSchema).min(1).max(5),
  endpointUrl: optionalFromEmpty(UrlSchema),
  documentationUrl: optionalFromEmpty(UrlSchema),
  websiteUrl: optionalFromEmpty(UrlSchema),
  pricingModel: z.nativeEnum(PricingModel).optional().default(PricingModel.FREE),
  pricingDetails: optionalFromEmpty(z.string().trim().max(300)),
  isPublished: z.boolean().optional().default(false),
  logoUrl: optionalFromEmpty(UrlSchema),
  bannerUrl: optionalFromEmpty(UrlSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const UpdateAgentSchemaFields = z.object({
  name: NameSchema.optional(),
  description: DescriptionSchema.optional(),
  longDescription: optionalFromEmpty(LongDescriptionSchema),
  skills: z.array(StringTagSchema).min(1).max(20).optional(),
  tags: z.array(StringTagSchema).max(20).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  protocols: z.array(ProtocolSchema).min(1).max(5).optional(),
  endpointUrl: optionalFromEmpty(UrlSchema),
  documentationUrl: optionalFromEmpty(UrlSchema),
  websiteUrl: optionalFromEmpty(UrlSchema),
  pricingModel: z.nativeEnum(PricingModel).optional(),
  pricingDetails: optionalFromEmpty(z.string().trim().max(300)),
  isPublished: z.boolean().optional(),
  logoUrl: optionalFromEmpty(UrlSchema),
  bannerUrl: optionalFromEmpty(UrlSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateAgentSchema = UpdateAgentSchemaFields.refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const ListAgentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  skills: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
  tags: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
  protocols: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
});

export const SearchAgentsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => {
      if (!value || value.length === 0) {
        return undefined;
      }

      return value;
    }),
  skills: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
  protocols: z
    .string()
    .optional()
    .transform((value) => parseCommaSeparated(value)),
  category: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => {
      if (!value || value.length === 0) {
        return undefined;
      }

      return value;
    }),
  pricing: z.nativeEnum(PricingModel).optional(),
  verified: z.preprocess(parseBooleanInput, z.boolean().optional()),
  sort: z.enum(["relevance", "rating", "newest", "name"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const AgentSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
});

export const RegisterAgentSchema = CreateAgentSchema.extend({
  agentCardVersion: z.string().trim().min(1).max(32).optional(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
export type ListAgentsQueryInput = z.infer<typeof ListAgentsQuerySchema>;
export type SearchAgentsQueryInput = z.infer<typeof SearchAgentsQuerySchema>;
export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;
