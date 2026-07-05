/**
 * TransferRadar — "Ryktesradarn": senaste övergångsnyheterna för klubben.
 * Server component. Läser transfer-klassade artiklar (Echo sätter event_type)
 * där klubbens entity finns i entity_ids. "Bekräftad" när klubben själv är
 * källan eller rubriken är en officiell bekräftelse — annars ryktesnivå.
 */

import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const CLUB_SOURCES = /aik fotboll|djurgårdens if|hammarby if|malmö ff|ifk göteborg|\.se\b.*(aikfotboll|dif|hammarbyfotboll|mff|ifkgoteborg)/i;
const CONFIRMED_TITLE = /^(officiellt|klart|bekräftat)\s*:/i;

interface RadarItem {
  id: string;
  slug: string | null;
  title: string;
  source_name: string | null;
  published_at: string | null;
  confirmed: boolean;
}

async function getRadar(teamSlug: string): Promise<RadarItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data: entity } = await db
      .from("entities")
      .select("id")
      .eq("type", "team")
      .eq("slug", teamSlug)
      .maybeSingle();
    if (!entity?.id) return [];

    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
    const { data } = await db
      .from("articles")
      .select("id, slug, title, source_name, published_at")
      .eq("sport", "football")
      .eq("status", "published")
      .eq("event_type", "transfer")
      .contains("entity_ids", [entity.id])
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(6);

    return (data ?? []).map((a) => ({
      id: String(a.id),
      slug: a.slug ? String(a.slug) : null,
      title: String(a.title),
      source_name: a.source_name ? String(a.source_name) : null,
      published_at: a.published_at ? String(a.published_at) : null,
      confirmed:
        CONFIRMED_TITLE.test(String(a.title)) ||
        CLUB_SOURCES.test(String(a.source_name ?? "")),
    }));
  } catch {
    return [];
  }
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600_000);
  if (h < 1) return "just nu";
  if (h < 24) return `${h} tim`;
  return `${Math.round(h / 24)} d`;
}

export async function TransferRadar({ teamSlug }: { teamSlug: string }) {
  const items = await getRadar(teamSlug);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 mt-6" aria-label="Ryktesradarn">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Ryktesradarn
          </h2>
          <Link href="/nyheter/transferer" className="text-xs text-pitch hover:underline">
            Alla transfers →
          </Link>
        </div>
        <ul className="divide-y divide-border/50">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={it.slug ? `/artikel/${it.slug}` : "/nyheter/transferer"}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    it.confirmed
                      ? "bg-pitch/15 text-pitch"
                      : "bg-orange-400/10 text-orange-400"
                  }`}
                >
                  {it.confirmed ? "Bekräftad" : "Rykte"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground leading-snug line-clamp-2">
                    {it.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {it.source_name ?? "Okänd källa"} · {relTime(it.published_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
