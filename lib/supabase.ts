/**
 * lib/supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase-helpers för Athopia.
 *
 * Beslut: Vi exporterar två klienter:
 *  - `createServerClient` – används i Server Components och Route Handlers med
 *    service-role key (läser/skriver utan RLS-begränsning).
 *  - `createBrowserClient` – används i Client Components med anon key +
 *    Supabase RLS-regler.
 *
 * Typerna genereras av `pnpm supabase gen types` och importeras från
 * @/types/supabase (skapas manuellt/via Supabase CLI).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

// ─── Miljövariabler ────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Server-klient (Server Components / API routes) ────────────────────────────
// Använder service role key – kör aldrig i klienten.
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY måste sättas."
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

// ─── Browser-klient (Client Components) ───────────────────────────────────────
// Singleton-mönster för att undvika duplicerade instanser.
let browserClient: ReturnType<typeof createClient> | null = null;
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY måste sättas."
    );
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

// ─── Convenience-export för Server Components ─────────────────────────────────
export const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "");

// ─── Typdefinitioner för Athopias databas ─────────────────────────────────────
export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string | null;
  source_url: string;
  source_name: string;
  image_url: string | null;
  published_at: string;
  entities: Entity[];
  embedding?: number[]; // pgvector
}

export interface Entity {
  id: string;
  name: string;
  type: "team" | "player" | "competition" | "person";
  slug: string;
}

export interface Narrative {
  id: string;
  topic: string;
  score: number;           // 0–100, algoritmiskt beräknat engagemang
  source_count: number;
  trend: "up" | "down" | "stable";
  entities: Entity[];
  created_at: string;
  updated_at: string;
}

export interface PodcastEpisode {
  id: string;
  show_name: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  transcript_html: string | null; // PRO-gated
  published_at: string;
  entities: Entity[];
}
