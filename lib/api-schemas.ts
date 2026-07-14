import { z } from "zod";

/**
 * Enda källan för de API-svar iOS avkodar.
 *
 * Servern validerar sina egna svar mot dessa scheman (`jsonContract`), OpenAPI
 * genereras ur dem, och `lib/swift-decode.test.ts` jämför de handskrivna
 * Swift-modellerna mot dem. En serverändring som skulle bryta iOS-decoden
 * failar därför i CI i stället för hos användaren.
 *
 * Regler:
 * - `.nullable()` = fältet skickas men kan vara null → Swift-typen MÅSTE vara optional.
 * - `.optional()` = fältet kan saknas helt → Swift-typen MÅSTE vara optional.
 * - Nya fält är alltid additiva. Ta aldrig bort ett fält som iOS avkodar
 *   non-optional utan att skeppa iOS-ändringen först.
 */

export const ImportanceTierSchema = z.enum(["breaking", "major", "normal", "noise"]);

export const FeedItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  time: z.string(),
  href: z.string(),
  newsTag: z.string().nullable().optional(),
  sourceCount: z.number().int().nullable().optional(),
  storyClusterId: z.string().nullable().optional(),
  importanceTier: ImportanceTierSchema.nullable().optional(),
});

export const FeedResponseSchema = z.object({
  items: z.array(FeedItemSchema),
  hasMore: z.boolean(),
  /** Legacy — grundfeeden är gratis och obegränsad. Får aldrig skapa klient-paywall. */
  gated: z.boolean(),
  remainingToday: z.number().int().nullable(),
  isPro: z.boolean().optional(),
  isElite: z.boolean().optional(),
});

export const TeamRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string().nullable(),
  logoUrl: z.string().nullable(),
});

export const ScoreItemSchema = z.object({
  id: z.number().int(),
  startingAt: z.string(),
  status: z.string(),
  minute: z.number().int().nullable(),
  home: TeamRefSchema,
  away: TeamRefSchema,
  scoreHome: z.number().int().nullable(),
  scoreAway: z.number().int().nullable(),
});

export const ScoresResponseSchema = z.array(ScoreItemSchema);

export const NativeArticleDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().nullable(),
  publishedAt: z.string(),
  updatedAt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  kind: z.enum(["athopia", "external"]),
  summary: z.string().nullable(),
  summaryPreview: z.string().nullable(),
  content: z.string().nullable(),
  hasProtectedContent: z.boolean(),
  discussionCount: z.number().int(),
});

export const ArticleAccessStateSchema = z.object({
  feature: z.string(),
  unlocked: z.boolean(),
  requiredPlan: z.enum(["free", "pro", "elite"]),
  upgradePath: z.string(),
});

export const ArticleDetailResponseSchema = z.object({
  article: NativeArticleDetailSchema,
  access: ArticleAccessStateSchema,
});

/** Strukturerad 403 — klienterna renderar paywall ur detta, aldrig ur copy. */
export const PlanRequiredErrorSchema = z.object({
  error: z.string(),
  code: z.literal("plan_required"),
  feature: z.string(),
  requiredPlan: z.enum(["free", "pro", "elite"]),
  upgradePath: z.string(),
});

/** Endpoint-registret som OpenAPI genereras ur. */
export const API_CONTRACTS = [
  { method: "get", path: "/api/feed", name: "FeedResponse", schema: FeedResponseSchema },
  { method: "get", path: "/api/scores", name: "ScoresResponse", schema: ScoresResponseSchema },
  {
    method: "get",
    path: "/api/articles/{slug}",
    name: "ArticleDetailResponse",
    schema: ArticleDetailResponseSchema,
  },
] as const;

/**
 * Swift-modeller som avkodar dessa svar. Testet failar om en handskriven
 * Swift-struct har ett fält servern inte skickar, eller avkodar ett
 * nullable/optional fält som non-optional.
 *
 * ponytail: handskrivna Swift-modeller behålls och gate:as i stället för att
 * kodgenereras — codegen kan inte kompileras på Windows. Byt till genererade
 * modeller när bygget körs på macOS; kontraktet nedan är då redan källan.
 */
export const SWIFT_MODEL_CONTRACTS = [
  { swiftStruct: "FeedItem", schema: FeedItemSchema },
  { swiftStruct: "FeedResponse", schema: FeedResponseSchema },
  { swiftStruct: "ScoreItem", schema: ScoreItemSchema },
  { swiftStruct: "TeamRef", schema: TeamRefSchema },
  { swiftStruct: "NativeArticleDetail", schema: NativeArticleDetailSchema },
  { swiftStruct: "ArticleAccessState", schema: ArticleAccessStateSchema },
] as const;
