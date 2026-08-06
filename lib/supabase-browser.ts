/**
 * lib/supabase-browser.ts — Supabase-klient för Client Components
 * ─────────────────────────────────────────────────────────────────────────────
 * Anon-nyckel + RLS. Ligger i EGEN fil, skild från `lib/supabase.ts`, som är
 * server-only och innehåller service-role-fabriken.
 *
 * Varför delad: klientkomponenter behövde `createClient()` och importerade
 * därför `lib/supabase.ts` — vilket drog in service-role-fabriken i
 * klientbundlen (verifierat i .next/static under säkerhetsauditen 2026-08-06).
 * Nyckelns värde följde inte med (Next inlinar bara NEXT_PUBLIC_*), men koden
 * låg där och ett framtida namnbyte hade räckt för att läcka den på riktigt.
 *
 * Samma filnamn används i athopia-admin — håll konventionen.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Singleton — undviker duplicerade instanser och dubbla realtime-anslutningar.
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY måste sättas."
    );
  }
  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}
