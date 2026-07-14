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

// ── Team hub (GET /api/team/{slug}/hub) ──────────────────────────────────────
//
// Routen är en superset: web (onboarding + gäst-preview) läser points/nextMatch/
// lastMatch/href, iOS avkodar stats/radar/leaders/squad/recent/upcoming.
// Wire-formatet är explicit camelCase — förlita dig aldrig på iOS
// `.convertFromSnakeCase` här: DB blandar `sportmonks_id` och `sportsmonks_id`.
// AI-ytor (pulse, dailyEpisode) ligger medvetet UTANFÖR denna route: de är
// PRO-gatede och får inte läcka via en publik preview.

export const TeamSeasonStatsSchema = z.object({
  teamId: z.number().int().nullable(),
  played: z.number().int(),
  wins: z.number().int(),
  draws: z.number().int(),
  losses: z.number().int(),
  goalsFor: z.number().int(),
  goalsAgainst: z.number().int(),
  goalDiff: z.number().int(),
  points: z.number().int(),
  position: z.number().int().nullable(),
  possession: z.number().nullable(),
  /** Endast verkligt syncade värden — aldrig placeholder-nollor. */
  xgFor: z.number().nullable(),
  xgAgainst: z.number().nullable(),
  xg: z.number().nullable().optional(),
  xga: z.number().nullable().optional(),
});

export const RadarPointSchema = z.object({
  metric: z.string(),
  value: z.number(),
  raw: z.number(),
});

export const LeaderRowSchema = z.object({
  playerId: z.number().int(),
  fullname: z.string(),
  slug: z.string().nullable(),
  image: z.string().nullable(),
  position: z.string().nullable(),
  goals: z.number().int(),
  assists: z.number().int(),
  appearances: z.number().int(),
});

export const FixtureRowSchema = z.object({
  sportsmonksId: z.number().int(),
  homeTeamId: z.number().int(),
  awayTeamId: z.number().int(),
  homeTeamName: z.string(),
  awayTeamName: z.string(),
  homeScore: z.number().int().nullable(),
  awayScore: z.number().int().nullable(),
  kickoffAt: z.string().nullable(),
  status: z.string(),
});

export const DashArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  href: z.string(),
  publishedAt: z.string().nullable(),
  sourceName: z.string().nullable(),
});

export const DashThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  replyCount: z.number().int().nullable(),
  href: z.string(),
  createdAt: z.string().nullable(),
});

export const TeamInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  sportsmonksId: z.number().int().nullable(),
});

export const TeamHubPayloadSchema = z.object({
  team: TeamInfoSchema,
  position: z.number().int().nullable(),
  stats: TeamSeasonStatsSchema.nullable(),
  form: z.array(z.string()),
  radar: z.array(RadarPointSchema),
  topScorers: z.array(LeaderRowSchema),
  topAssists: z.array(LeaderRowSchema),
  squad: z.array(LeaderRowSchema),
  recent: z.array(FixtureRowSchema),
  upcoming: z.array(FixtureRowSchema),
  news: z.array(DashArticleSchema),
  threads: z.array(DashThreadSchema),
  // Preview-fält som webbens onboarding och gäst-preview läser.
  points: z.number().int().nullable(),
  played: z.number().int().nullable(),
  nextMatch: z
    .object({
      id: z.number().int(),
      home: z.string(),
      away: z.string(),
      kickoffAt: z.string().nullable(),
      status: z.string(),
    })
    .nullable(),
  lastMatch: z
    .object({
      id: z.number().int(),
      home: z.string(),
      away: z.string(),
      homeScore: z.number().int().nullable(),
      awayScore: z.number().int().nullable(),
      kickoffAt: z.string().nullable(),
    })
    .nullable(),
  guest: z.boolean(),
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
  {
    method: "get",
    path: "/api/team/{slug}/hub",
    name: "TeamHubPayload",
    schema: TeamHubPayloadSchema,
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
  { swiftStruct: "TeamHubPayload", schema: TeamHubPayloadSchema },
  { swiftStruct: "TeamInfo", schema: TeamInfoSchema },
  { swiftStruct: "TeamSeasonStats", schema: TeamSeasonStatsSchema },
  { swiftStruct: "RadarPoint", schema: RadarPointSchema },
  { swiftStruct: "LeaderRow", schema: LeaderRowSchema },
  { swiftStruct: "FixtureRow", schema: FixtureRowSchema },
  { swiftStruct: "DashArticle", schema: DashArticleSchema },
  { swiftStruct: "DashThread", schema: DashThreadSchema },
] as const;
