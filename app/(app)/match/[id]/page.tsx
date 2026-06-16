import type { Metadata } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 60;

interface PageProps { params: Promise<{ id: string }> }

async function getData(fixtureId: number) {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const [{ data: fix }, { data: tms }, { data: evts }, { data: lups }, { data: sum }] = await Promise.all([
    db.from("fixtures").select("*").eq("sportmonks_id", fixtureId).maybeSingle(),
    db.from("team_match_stats").select("*").eq("fixture_id", fixtureId),
    db.from("fixture_events").select("*").eq("fixture_id", fixtureId).order("minute"),
    db.from("fixture_lineups").select("*, players(fullname,image,position,sportmonks_id)").eq("fixture_id", fixtureId).order("starter", { ascending: false }),
    db.from("match_summaries").select("summary,generated_at").eq("fixture_id", fixtureId).maybeSingle(),
  ]);
  return { fix, tms: tms ?? [], evts: evts ?? [], lups: lups ?? [], sum };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return { title: "Match | Athopia" };
  const db = createServerClient();
  const { data } = await db.from("fixtures").select("home_team_name,away_team_name,home_score,away_score").eq("sportmonks_id", fid).maybeSingle();
  if (!data) return { title: "Match | Athopia" };
  return { title: `${data.home_team_name} ${data.home_score}–${data.away_score} ${data.away_team_name} | Athopia` };
}

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽", own_goal: "⚽🔴", yellow_card: "🟨", red_card: "🟥", sub: "🔄", missed_pen: "❌",
};

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return <p className="text-center py-16 text-muted-foreground">Ogiltigt match-ID.</p>;

  const d = await getData(fid);
  const fix = d?.fix as Record<string, unknown> | null;

  if (!fix) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>Ingen data för match #{fid}.</p>
        <p className="text-xs mt-1">Data synkas automatiskt efter matchslut av Hetzner-agenten.</p>
      </div>
    );
  }

  const homeName = fix.home_team_name as string;
  const awayName = fix.away_team_name as string;
  const homeScore = (fix.home_score as number) ?? 0;
  const awayScore = (fix.away_score as number) ?? 0;
  const isLive = fix.status === "LIVE";
  const kickoff = fix.kickoff_at as string | null;

  const tms = (d?.tms ?? []) as Record<string, unknown>[];
  // Matcha hem/borta via home_team_id
  const homeTeamId = String(fix.home_team_id ?? "");
  const awayTeamId = String(fix.away_team_id ?? "");
  const homeStat = tms.find(t => String(t.team_id) === homeTeamId) ?? tms[0];
  const awayStat = tms.find(t => String(t.team_id) === awayTeamId) ?? tms[1];

  const evts  = (d?.evts ?? []) as Record<string, unknown>[];
  const lups  = (d?.lups ?? []) as Record<string, unknown>[];
  const starters  = lups.filter(l => l.starter);
  const homeLup   = starters.filter(l => String(l.team_id) === homeTeamId);
  const awayLup   = starters.filter(l => String(l.team_id) === awayTeamId);
  const summary   = d?.sum?.summary as string | null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Resultat-header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-xs text-muted-foreground text-center mb-3">
          Allsvenskan {kickoff ? new Date(kickoff).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }) : ""}
          {isLive && <span className="ml-2 text-red-500">● LIVE</span>}
        </p>
        <div className="flex items-center justify-center gap-6">
          <p className="text-lg font-bold text-right flex-1">{homeName}</p>
          <div className="text-center">
            <p className="font-bold text-6xl tabular-nums text-foreground">{homeScore}–{awayScore}</p>
            <p className="text-xs text-muted-foreground mt-1">{fix.status as string}</p>
          </div>
          <p className="text-lg font-bold text-left flex-1">{awayName}</p>
        </div>
      </div>

      {/* AI-sammanfattning */}
      {summary && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">Athopia AI · Matchanalys</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matchstatistik */}
        <div className="lg:col-span-2 space-y-4">
          {/* Teamstats */}
          {(homeStat || awayStat) && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Matchstatistik</h3>
              {[
                { label: "xG", h: Number(homeStat?.xg ?? 0).toFixed(2), a: Number(awayStat?.xg ?? 0).toFixed(2), hv: Number(homeStat?.xg ?? 0), av: Number(awayStat?.xg ?? 0) },
                { label: "Bollinnehav %", h: homeStat?.possession, a: awayStat?.possession, hv: Number(homeStat?.possession ?? 50), av: Number(awayStat?.possession ?? 50) },
                { label: "Skott", h: homeStat?.shots, a: awayStat?.shots, hv: Number(homeStat?.shots ?? 0), av: Number(awayStat?.shots ?? 0) },
                { label: "Skott på mål", h: homeStat?.shots_on_target, a: awayStat?.shots_on_target, hv: Number(homeStat?.shots_on_target ?? 0), av: Number(awayStat?.shots_on_target ?? 0) },
                { label: "Hörnsparkar", h: homeStat?.corners, a: awayStat?.corners, hv: Number(homeStat?.corners ?? 0), av: Number(awayStat?.corners ?? 0) },
                { label: "Passningar", h: homeStat?.passes, a: awayStat?.passes, hv: Number(homeStat?.passes ?? 0), av: Number(awayStat?.passes ?? 0) },
              ].map(({ label, h, a, hv, av }) => {
                const total = hv + av || 1;
                const pct = Math.round((hv / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{String(h ?? "–")}</span>
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{String(a ?? "–")}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full flex overflow-hidden">
                      <div className="bg-pitch" style={{ width: `${pct}%` }} />
                      <div className="bg-blue-500" style={{ width: `${100 - pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Händelsetidslinje */}
          {evts.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Händelser</h3>
              <div className="space-y-2">
                {evts.map((e, i) => {
                  const isHome = String(e.team_id) === homeTeamId;
                  const icon = EVENT_ICONS[e.event_type as string] ?? "•";
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? "flex-row" : "flex-row-reverse"}`}>
                      <span className="text-xs text-muted-foreground w-8 text-center">{String(e.minute ?? "?")}′</span>
                      <span>{icon}</span>
                      <span className="text-foreground/80 flex-1 truncate">{String(e.result ?? e.event_type ?? "")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Lineups */}
        {(homeLup.length > 0 || awayLup.length > 0) && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Startelvor</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ name: homeName, players: homeLup }, { name: awayName, players: awayLup }].map(({ name, players }) => (
                <div key={name}>
                  <p className="text-xs font-semibold text-foreground mb-2 truncate">{name}</p>
                  {players.map((p, i) => {
                    const pl = p.players as Record<string, unknown> | null;
                    return (
                      <div key={i} className="text-xs text-muted-foreground py-0.5 flex items-center gap-1">
                        <span className="text-foreground/50">{p.jersey as number ?? "—"}</span>
                        <span className="truncate">{(pl?.fullname as string) ?? "–"}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
