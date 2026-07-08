import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const SPORT = "football";

export type LandingCopy = {
  headlineAccent: string;
  body: string;
  ctaLabel: string | null;
  source: string;
};

const DEFAULT: LandingCopy = {
  headlineAccent: "Varje dag.",
  body:
    "Vi läser alla svenska källor, följer varje match och räknar på varje siffra — så att du alltid vet vad som händer i din klubb. Byggt för supportrar som kan fotboll.",
  ctaLabel: null,
  source: "default",
};

/** Growth-agent kan uppdatera hero-copy när ett experiment vinner. */
export async function getLandingCopy(): Promise<LandingCopy> {
  if (!isSupabaseConfigured()) return DEFAULT;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("landing_copy")
      .select("headline_accent, body, cta_label, source")
      .eq("sport", SPORT)
      .maybeSingle();

    if (!data?.headline_accent || !data?.body) return DEFAULT;

    return {
      headlineAccent: String(data.headline_accent),
      body: String(data.body),
      ctaLabel: data.cta_label ? String(data.cta_label) : null,
      source: String(data.source ?? "default"),
    };
  } catch {
    return DEFAULT;
  }
}
