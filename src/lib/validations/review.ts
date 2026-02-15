import { z } from "zod";

function optionalFromEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal(""), z.undefined()])
    .transform((value) => (value === "" ? undefined : value));
}

const AgentSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

const ReviewBodySchema = z.string().trim().min(20).max(2000);

const ReviewContentSchema = z
  .object({
    content: optionalFromEmpty(ReviewBodySchema),
    comment: optionalFromEmpty(ReviewBodySchema),
  })
  .superRefine((value, ctx) => {
    if (!value.content && !value.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide content or comment",
        path: ["content"],
      });
    }
  })
  .transform((value) => ({
    content: value.content ?? value.comment ?? "",
  }));

export const CreateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    title: optionalFromEmpty(z.string().trim().max(200)),
    isVerifiedUse: z.coerce.boolean().optional().default(false),
    authorAgentSlug: optionalFromEmpty(AgentSlugSchema),
    content: optionalFromEmpty(ReviewBodySchema),
    comment: optionalFromEmpty(ReviewBodySchema),
  })
  .and(ReviewContentSchema)
  .transform((value) => ({
    rating: value.rating,
    title: value.title,
    isVerifiedUse: value.isVerifiedUse,
    authorAgentSlug: value.authorAgentSlug,
    content: value.content,
  }));

export const UpdateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: optionalFromEmpty(z.string().trim().max(200)),
    isVerifiedUse: z.coerce.boolean().optional(),
    content: optionalFromEmpty(ReviewBodySchema),
    comment: optionalFromEmpty(ReviewBodySchema),
  })
  .superRefine((value, ctx) => {
    if (
      value.rating === undefined &&
      value.title === undefined &&
      value.isVerifiedUse === undefined &&
      value.content === undefined &&
      value.comment === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field must be provided",
      });
    }
  })
  .transform((value) => ({
    rating: value.rating,
    title: value.title,
    isVerifiedUse: value.isVerifiedUse,
    content: value.content ?? value.comment,
  }));

export const VoteReviewSchema = z.object({
  isHelpful: z.boolean(),
});

export const FlagReviewSchema = z.object({
  reason: z.string().trim().min(5).max(300),
});

export const ReviewIdParamsSchema = z.object({
  id: z.string().trim().min(2).max(120),
});

export const ListReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "highest", "lowest", "helpful"]).default("newest"),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type VoteReviewInput = z.infer<typeof VoteReviewSchema>;
export type ListReviewsQueryInput = z.infer<typeof ListReviewsQuerySchema>;
