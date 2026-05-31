export type SubscriptionTier = "free" | "pro";

export interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  subscriptionTier: SubscriptionTier;
  createdAt?: string;
  updatedAt?: string;
}

export type EntityType = "team" | "player" | "coach";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  slug: string;
  imageUrl?: string | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string | null;
  sourceUrl?: string | null;
  url?: string | null;
  sourceName: string;
  sourceType?: string | null;
  imageUrl: string | null;
  publishedAt: string;
  updatedAt?: string | null;
  importanceScore?: number | null;
  sentimentScore?: number | null; // -1..1
  entities: Entity[];
}

export interface Podcast {
  id: string;
  showName: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
  imageUrl?: string | null;
  hasTranscript?: boolean;
  entities: Entity[];
}

export interface PodcastChunk {
  id: string;
  podcastId: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  entities?: Entity[];
}

export type NarrativeTrend = "rising" | "falling" | "stable";

export interface Narrative {
  id: string;
  topic: string;
  score: number; // 0..1
  sourceCount: number;
  trend: NarrativeTrend;
  sentimentScore?: number | null; // -1..1
  entities: Entity[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentLog {
  id: string;
  createdAt: string;
  agentName: string;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown> | null;
}

export interface Task {
  id: string;
  createdAt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  name: string;
  meta?: Record<string, unknown> | null;
}

export interface ContentQueueItem {
  id: string;
  createdAt: string;
  status: "queued" | "processing" | "done" | "error";
  type: "article" | "podcast" | "narrative";
  sourceId: string;
  meta?: Record<string, unknown> | null;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface Player {
  id: number;
  name: string;
  slug: string;
  teamId?: number | null;
  position?: string | null;
  age?: number | null;
  imageUrl?: string | null;
}

export interface Match {
  id: number;
  startingAt: string;
  status: "LIVE" | "FT" | "NS" | string;
  minute?: number | null;
  home: Team;
  away: Team;
  scoreHome?: number | null;
  scoreAway?: number | null;
  details?: {
    possessionHome?: number | null;
    possessionAway?: number | null;
    shotsHome?: number | null;
    shotsAway?: number | null;
  };
}

export interface ForumThread {
  id: string;
  team_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  view_count: number;
  last_reply_at: string;
  created_at: string;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  content: string;
  author_id: string;
  author_name: string;
  likes: number;
  flagged: boolean;
  created_at: string;
}

export interface Standing {
  team: Team;
  position: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: Array<"W" | "D" | "L">;
}

