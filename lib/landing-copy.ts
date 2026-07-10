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
    "Nyheter, rykten, siffror och snack om din klubb — vi läser hundratals svenska källor varje dygn, sorterar bort bruset och sammanfattar det som betyder något. 60 sekunder om dagen, så vet du allt.",
  ctaLabel: "Välj din klubb — gratis",
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
