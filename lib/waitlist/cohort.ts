/**
 * lib/waitlist/cohort.ts — vem som har rätt till Founder-priset.
 *
 * Skiljelinjen som hela §1.2 hänger på: att Founder inte SYNS som erbjudande
 * (potten slut) är inte samma sak som att ingen får köpa det. Den som redan
 * bekräftat en Founder-plats har ett låst avtal och betalar 69 kr även efter
 * att erbjudandet försvunnit ur all publik UI.
 *
 * Server-only: läser DB med service-role.
 */

import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { invalidateFounderOfferCache } from "@/lib/founder-offer";
export type { Cohort } from "./founder-rules";
export { isEntitledToFounder, claimsPotSeat } from "./founder-rules";

export interface WaitlistCohortRow {
  id: string;
  cohort: "founder" | "regular" | null;
  status: string;
}

/** Waitlist-raden för en inloggad användare, eller null om hen aldrig stod i kön. */
export async function loadWaitlistByClerkUser(
  clerkUserId: string,
): Promise<WaitlistCohortRow | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("waitlist")
      .select("id, cohort, status")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();
    return (data as WaitlistCohortRow | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Reserverar en betald Founder-plats atomärt. `false` betyder "taket är nått"
 * och anroparen ska tyst sätta 89 kr — aldrig ett felmeddelande, aldrig en
 * halvvägs-Founder.
 *
 * Fail-closed: kan vi inte nå DB reserverar vi ingenting och kunden betalar
 * ordinarie pris. Ett för högt pris går att rätta; en prenumeration som är låst
 * på 69 kr i Stripe gör det inte.
 */
export async function reserveFounderSeat(claimPot: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const db = createServiceClient();
    const { data, error } = await db.rpc("reserve_founder_seat", { p_claim_pot: claimPot });
    if (error) {
      console.error("[founder] reserve_founder_seat fel:", error.message);
      return false;
    }
    if (data === true) invalidateFounderOfferCache();
    return data === true;
  } catch {
    return false;
  }
}

/** Släpper tillbaka en reservation när checkouten aldrig blev av. */
export async function releaseFounderSeat(releasePot: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const db = createServiceClient();
    await db.rpc("release_founder_seat", { p_release_pot: releasePot });
    invalidateFounderOfferCache();
  } catch {
    // Tyst: en icke-släppt plats kostar oss en Founder-plats, inte en kund.
  }
}
