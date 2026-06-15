import type { Metadata } from "next";
import { Brain, Star } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Article } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dagliga sammanfattningar",
  description: "AI-genererade sammanfattningar för alla Allsvenskan-lag.",
};

export const dynamic = 'force-dynamic';

async function getAllsvenskanDigest(): Promise<Article | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("source_name", "Athopia AI")
      .eq("status", "published")
      .filter("metadata->>type", "eq", "allsvenskan_daily")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Article) ?? null;
  } catch {
    return null;
  }
}

async function getTeamSummaries(): Promise<{ team: string; article: Article }[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("source_name", "Athopia AI")
      .eq("status", "published")
      .filter("metadata->>type", "eq", "team_summary")
      .order("created_at", { ascending: false })
      .limit(64);

    if (!data) return [];

    const seen = new Set<string>();
    const result: { team: string; article: Article }[] = [];

    for (const row of data as any[]) {
      const team = (row.metadata as any)?.team as string | undefined;
      if (!team || seen.has(team)) continue;
      seen.add(team);
      result.push({ team, article: row as Article });
    }

    return result;
  } catch {
    return [];
  }
}

function getTeamInitials(teamSlug: string): string {
  return teamSlug
    .split("-")
    .filter((w) => w.length > 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3) || teamSlug.slice(0, 3).toUpperCase();
}

const TEAM_COLORS: Record<string, string> = {
  aik: "#000000",
  "djurgardens-if": "#005FA8",
  "malmoe-ff": "#86CEBC",
  "hammarby-if": "#00843D",
  "bk-haecken": "#F9C301",
  "ifk-goeteborg": "#003F8B",
  "if-elfsborg": "#F9A12E",
  "ifk-norrkoping": "#1A4591",
  "kalmar-ff": "#004B9D",
  "helsingborgs-if": "#009B3A",
};

export default async function SammanfattningPage() {
  const [digest, teamSummaries] = await Promise.all([
    getAllsvenskanDigest(),
    getTeamSummaries(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-foreground">DAGLIGA SAMMANFATTNINGAR</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-genererade analyser för Allsvenskan och varje lag
        </p>
      </div>

      {/* Allsvenskan-digest */}
      {digest && (
        <section className="relative overflow-hidden rounded-2xl border border-pitch/30 bg-pitch/5 p-6 sm:p-8 mb-10">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-br from-pitch to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-pitch" />
              <span className="text-sm font-semibold text-pitch uppercase tracking-widest">
                Allsvenskan idag
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {new Date(digest.publishedAt ?? "").toLocaleDateString("sv-SE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
              {digest.title}
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
              {digest.summary ?? digest.content?.slice(0, 400)}
            </p>
          </div>
        </section>
      )}

      {/* Lag-sammanfattningar grid */}
      {teamSummaries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga lag-sammanfattningar ännu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamSummaries.map(({ team, article }) => {
            const color = TEAM_COLORS[team] ?? "var(--color-pitch)";
            const initials = getTeamInitials(team);

            return (
              <div
                key={team}
                className="relative bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
                style={{ borderTopColor: color, borderTopWidth: 3 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {team.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(article.publishedAt ?? "").toLocaleDateString("sv-SE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">
                  {article.summary ?? article.content?.slice(0, 200)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
