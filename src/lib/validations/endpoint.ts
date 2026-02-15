import { EndpointAuthType, EndpointType } from "@prisma/client";
import { z } from "zod";

function optionalFromEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal(""), z.undefined()])
    .transform((value) => (value === "" ? undefined : value));
}

function isHttpsOrLocalhost(url: URL): boolean {
  if (url.protocol === "https:") {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  }

  return false;
}

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const AddEndpointSchema = z.object({
  type: z.nativeEnum(EndpointType),
  url: z
    .string()
    .url()
    .superRefine((value, ctx) => {
      const parsed = new URL(value);
      if (!isHttpsOrLocalhost(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endpoint URL must use HTTPS in production",
        });
      }
    }),
  method: optionalFromEmpty(z.string().trim().min(3).max(16)).default("POST"),
  authType: z.nativeEnum(EndpointAuthType).default(EndpointAuthType.NONE),
  authConfig: JsonRecordSchema.optional(),
  requestSchema: JsonRecordSchema.optional(),
  responseSchema: JsonRecordSchema.optional(),
  description: optionalFromEmpty(z.string().trim().max(500)),
  isDefault: z.boolean().optional().default(false),
  logResponses: z.boolean().optional().default(true),
});

export const UpdateEndpointSchema = AddEndpointSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const EndpointParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

export type AddEndpointInput = z.infer<typeof AddEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof UpdateEndpointSchema>;

