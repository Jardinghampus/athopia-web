import { z } from "zod";

const MAX_FOLLOWED_TEAMS = 50;
const MAX_FOLLOWED_LEAGUES = 50;
const MAX_CONTENT_TYPES = 6;

const contentInterestSchema = z.enum([
  "transfer",
  "analysis",
  "match",
  "statistics",
  "injury",
  "table",
]);

/** Body accepted by PATCH /api/feed/config. Keep this aligned with user_feed_config. */
export const FeedConfigPatchSchema = z
  .object({
    followed_team_ids: z.array(z.string().trim().min(1).max(100)).max(MAX_FOLLOWED_TEAMS).optional(),
    followed_leagues: z.array(z.string().trim().min(1).max(100)).max(MAX_FOLLOWED_LEAGUES).optional(),
    content_types: z.array(contentInterestSchema).max(MAX_CONTENT_TYPES).optional(),
    personalization_enabled: z.boolean().optional(),
    sport: z.literal("football").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one feed preference is required",
  });

export type FeedConfigPatch = z.infer<typeof FeedConfigPatchSchema>;
