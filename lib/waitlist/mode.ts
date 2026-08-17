/**
 * lib/waitlist/mode.ts — waitlist-läget.
 *
 * Env, inte `system_config`: läget byts en gång vid lansering och Vercel är
 * enklare att rulla tillbaka än en DB-rad. `WAITLIST_MODE=true` betyder att
 * produkten inte är öppen än — landningens CTA pekar på `/vaenta` och
 * `/sign-up` stängs.
 *
 * Ingen `NEXT_PUBLIC_`-variant med flit: läget avgör routing i `proxy.ts` och
 * ska inte gå att läsa av eller gissa i klientbundlen. Server components läser
 * det och skickar vidare som prop.
 */

export function isWaitlistMode(): boolean {
  return process.env.WAITLIST_MODE === "true";
}

/** Vart landningens primära CTA pekar. */
export function primaryCtaHref(waitlistMode: boolean): string {
  return waitlistMode ? "/vaenta" : "/onboarding";
}

/** Fallback-etikett när landing_copy inte anger någon. */
export function primaryCtaLabel(waitlistMode: boolean): string {
  return waitlistMode ? "Håll platsen" : "Välj din klubb — gratis";
}
