/**
 * lib/waitlist/confirm.ts — dubbel opt-in, utan GET-biverkning.
 *
 * Outlook Safe Links och liknande prefetchar GET. Om claim körs på GET tar en
 * scanner Founder-platsen. GET får bara titta; POST (server action) claimar.
 */

import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { hashConfirmToken, isExpired } from "@/lib/waitlist/token";
import { logFunnelEvent } from "@/lib/funnel";
import { invalidateFounderOfferCache } from "@/lib/founder-offer";

export type ConfirmOutcome = "founder" | "regular" | "expired" | "invalid" | "already";

export const CONFIRM_OUTCOMES: readonly ConfirmOutcome[] = [
  "founder",
  "regular",
  "expired",
  "invalid",
  "already",
];

export function parseConfirmOutcome(raw: string | string[] | undefined): ConfirmOutcome | null {
  const value = typeof raw === "string" ? raw : "";
  return CONFIRM_OUTCOMES.includes(value as ConfirmOutcome) ? (value as ConfirmOutcome) : null;
}

export async function peekWaitlistToken(token: string): Promise<ConfirmOutcome | "pending"> {
  if (!token || !isSupabaseConfigured()) return "invalid";

  const db = createServiceClient();
  const hash = hashConfirmToken(token);
  const { data } = await db
    .from("waitlist")
    .select("id, status, confirm_expires_at")
    .eq("confirm_token_hash", hash)
    .maybeSingle();

  const row = data as { id: string; status: string; confirm_expires_at: string | null } | null;
  if (!row) return "invalid";
  if (row.status !== "pending_confirm") return "already";
  if (isExpired(row.confirm_expires_at)) return "expired";
  return "pending";
}

export async function confirmWaitlistToken(token: string): Promise<ConfirmOutcome> {
  if (!token || !isSupabaseConfigured()) return "invalid";

  const db = createServiceClient();
  const hash = hashConfirmToken(token);

  const { data } = await db
    .from("waitlist")
    .select("id, email, status, confirm_expires_at")
    .eq("confirm_token_hash", hash)
    .maybeSingle();

  const row = data as
    | { id: string; email: string; status: string; confirm_expires_at: string | null }
    | null;

  if (!row) return "invalid";
  if (row.status !== "pending_confirm") return "already";
  if (isExpired(row.confirm_expires_at)) return "expired";

  const { data: cohort, error } = await db.rpc("claim_waitlist_cohort", { p_id: row.id });
  if (error || !cohort) return "invalid";

  invalidateFounderOfferCache();

  try {
    const clerk = await clerkClient();
    const entry = await clerk.waitlistEntries.create({
      emailAddress: row.email,
      notify: false,
    });
    if (entry?.id) {
      await db.from("waitlist").update({ clerk_waitlist_id: entry.id }).eq("id", row.id);
    }
  } catch (err) {
    console.error("[waitlist] Clerk-spegling misslyckades:", err instanceof Error ? err.message : err);
  }

  await logFunnelEvent("waitlist_confirmed", null, { cohort: String(cohort) });
  return cohort === "founder" ? "founder" : "regular";
}
