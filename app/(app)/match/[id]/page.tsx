import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { MatchXgChart } from "./MatchXgChart";
import { MatchForum } from "./MatchForum";

export const revalidate = 60;

interface PageProps { params: Promise<{ id: string }> }

async function getData(fixtureId: number) {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const [{ data: fix }, { data: tms }, { data: evts }, { data: lups }, { data: cqAnalysis }] = await Promise.all([
    db.from("fixtures").select("*").eq("sportmonks_id", fixtureId).maybeSingle(),
    db.from("team_match_stats").select("*").eq("fixture_id", fixtureId),
    db.from("fixture_events").select("*").eq("fixture_id", fixtureId).order("minute"),
    db.from("fixture_lineups").select("*").eq("fixture_id", fixtureId).order("starter", { ascending: false }),
    db.from("content_queue")
      .select("content,created_at")
      .eq("status", "approved")
      .filter("metadata->>type", "eq", "post_match_analysis")
      .filter("metadata->>fixture_id", "eq", String(fixtureId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  // Hämta spelarnamn separat för de player_ids som finns i lineups och händelser.
  const playerIds = Array.from(new Set([
    ...(lups ?? []).flatMap((l: Record<string, unknown>) => [l.player_id as number]),
    ...(evts ?? []).flatMap((e: Record<string, unknown>) => [e.player_id as number, e.related_player_id as number]),
  ].filter(Boolean)));
  let playerMap: Record<number, { fullname: string; image: string | null; position: string | null; slug: string | null }> = {};
  if (playerIds.length > 0) {
    const { data: players } = await db.from("players").select("sportmonks_id,fullname,image,position,slug").in("sportmonks_id", playerIds);
    for (const p of players ?? []) {
      playerMap[(p as Record<string, unknown>).sportmonks_id as number] = {
        fullname: (p as Record<string, unknown>).fullname as string,
        image: (p as Record<string, unknown>).image as string | null,
        position: (p as Record<string, unknown>).position as string | null,
        slug: (p as Record<string, unknown>).slug as string | null,
      };
    }
  }
  const lupsWithPlayers = (lups ?? []).map((l: Record<string, unknown>) => ({
    ...l,
    players: playerMap[l.player_id as number] ?? null,
  }));
  const analysisContent = cqAnalysis?.content as Record<string, string> | null;
  const sum = analysisContent
    ? { summary: analysisContent.body ?? null, title: analysisContent.title ?? null }
    : null;
  return { fix, tms: tms ?? [], evts: evts ?? [], lups: lupsWithPlayers, sum, playerMap };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return { title: "Match | Athopia" };
  const db = createServerClient();
  const { data } = await db.from("fixtures").select("home_team_name,away_team_name,home_score,away_score").eq("sportmonks_id", fid).maybeSingle();
  if (!data) return { title: "Match" };
  const title = `${data.home_team_name} ${data.home_score}–${data.away_score} ${data.away_team_name}`;
  return {
    title,
    description: `Matchrapport: ${data.home_team_name} mot ${data.away_team_name} i Allsvenskan 2026 — mål, händelser, statistik och AI-analys.`,
    alternates: { canonical: `https://athopia.se/match/${fid}` },
    openGraph: {
      type: "article",
      title,
      description: `${data.home_team_name} ${data.home_score}–${data.away_score} ${data.away_team_name} — Allsvenskan 2026`,
      url: `https://athopia.se/match/${fid}`,
    },
  };
}

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽", own_goal: "⚽🔴", yellow_card: "🟨", red_card: "🟥", sub: "🔄", missed_pen: "❌",
  GOAL: "⚽", OWN_GOAL: "⚽🔴", YELLOWCARD: "🟨", REDCARD: "🟥", YELLOW_RED_CARD: "🟥", SUBSTITUTION: "🔄", PENALTY_MISSED: "❌",
};

const EVENT_LABELS: Record<string, string> = {
  GOAL: "Mål",
  OWN_GOAL: "Självmål",
  YELLOWCARD: "Gult kort",
  REDCARD: "Rött kort",
  YELLOW_RED_CARD: "Andra gula",
  SUBSTITUTION: "Byte",
  PENALTY_MISSED: "Missad straff",
};

function statValue(value: unknown, suffix = "") {
  if (value == null || value === "") return "Ej synkad";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${number}${suffix}`;
}

function eventPlayerName(playerMap: Record<number, { fullname: string }>, id: unknown) {
  const playerId = Number(id ?? 0);
  return playerId ? playerMap[playerId]?.fullname ?? `Spelare ${playerId}` : null;
}

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
  const byJersey = (a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.jersey ?? 999) - Number(b.jersey ?? 999);
  const homeLup   = starters.filter(l => String(l.team_id) === homeTeamId).sort(byJersey);
  const awayLup   = starters.filter(l => String(l.team_id) === awayTeamId).sort(byJersey);
  const playerMap = (d?.playerMap ?? {}) as Record<number, { fullname: string }>;
  const summary      = (d?.sum as Record<string, string> | null)?.summary ?? null;
  const summaryTitle = (d?.sum as Record<string, string> | null)?.title ?? null;
  const hasXg = homeStat?.xg != null && awayStat?.xg != null;
  const homeXg = hasXg ? Number(homeStat?.xg) : null;
  const awayXg = hasXg ? Number(awayStat?.xg) : null;

  const matchJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeName} – ${awayName}`,
    sport: "Soccer",
    url: `https://athopia.se/match/${fid}`,
    ...(kickoff ? { startDate: kickoff } : {}),
    homeTeam: { "@type": "SportsTeam", name: homeName },
    awayTeam: { "@type": "SportsTeam", name: awayName },
    location: { "@type": "Place", name: "Allsvenskan" },
    ...(fix.status === "FT" ? {
      subEvent: [{
        "@type": "Report",
        description: `${homeName} ${homeScore}–${awayScore} ${awayName}`,
      }],
    } : {}),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(matchJsonLd) }} />
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
          {summaryTitle && <p className="font-semibold text-foreground mb-2">{summaryTitle}</p>}
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{summary}</p>
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
                hasXg ? { label: "xG", h: homeXg!.toFixed(2), a: awayXg!.toFixed(2), hv: homeXg!, av: awayXg! } : null,
                { label: "Bollinnehav", suffix: "%", h: homeStat?.possession, a: awayStat?.possession, hv: Number(homeStat?.possession ?? 50), av: Number(awayStat?.possession ?? 50) },
                { label: "Skott", h: homeStat?.shots, a: awayStat?.shots, hv: Number(homeStat?.shots ?? 0), av: Number(awayStat?.shots ?? 0) },
                { label: "Skott på mål", h: homeStat?.shots_on_target, a: awayStat?.shots_on_target, hv: Number(homeStat?.shots_on_target ?? 0), av: Number(awayStat?.shots_on_target ?? 0) },
                { label: "Hörnsparkar", h: homeStat?.corners, a: awayStat?.corners, hv: Number(homeStat?.corners ?? 0), av: Number(awayStat?.corners ?? 0) },
                { label: "Passningar", h: homeStat?.passes, a: awayStat?.passes, hv: Number(homeStat?.passes ?? 0), av: Number(awayStat?.passes ?? 0) },
              ].filter(Boolean).map((row) => {
                const { label, suffix = "", h, a, hv, av } = row!;
                const hasValues = h != null || a != null;
                const total = hasValues ? hv + av || 1 : 1;
                const pct = Math.round((hv / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{statValue(h, suffix)}</span>
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{statValue(a, suffix)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full flex overflow-hidden">
                      {hasValues ? (
                        <>
                          <div className="bg-pitch" style={{ width: `${pct}%` }} />
                          <div className="bg-blue-500" style={{ width: `${100 - pct}%` }} />
                        </>
                      ) : (
                        <div className="w-full bg-muted-foreground/20" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mål mot förväntan (xG) — endast när äkta xG finns */}
          {hasXg && (
            <MatchXgChart
              homeName={homeName}
              awayName={awayName}
              homeGoals={homeScore}
              awayGoals={awayScore}
              homeXg={homeXg!}
              awayXg={awayXg!}
            />
          )}

          {/* Händelsetidslinje */}
          {evts.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Händelser</h3>
              <div className="space-y-2">
                {evts.map((e, i) => {
                  const isHome = String(e.team_id) === homeTeamId;
                  const icon = EVENT_ICONS[e.event_type as string] ?? "•";
                  const type = String(e.event_type ?? "");
                  const player = eventPlayerName(playerMap, e.player_id);
                  const related = eventPlayerName(playerMap, e.related_player_id);
                  const label = type === "SUBSTITUTION"
                    ? `${related ? `${related} in` : "Inbytt"}${player ? `, ${player} ut` : ""}`
                    : `${EVENT_LABELS[type] ?? type}${player ? ` · ${player}` : ""}${related && type === "GOAL" ? ` (${related})` : ""}`;
                  return (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? "flex-row" : "flex-row-reverse"}`}>
                      <span className="text-xs text-muted-foreground w-8 text-center">{String(e.minute ?? "?")}′</span>
                      <span>{icon}</span>
                      <span className="text-foreground/80 flex-1 truncate">
                        {e.result ? `${e.result} · ` : ""}{label}
                      </span>
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
                    const href = `/spelare/${(pl?.slug as string | null) ?? String(p.player_id ?? "")}`;
                    return (
                      <div key={i} className="text-xs text-muted-foreground py-0.5 flex items-center gap-1">
                        <span className="text-foreground/50">{p.jersey as number ?? "—"}</span>
                        {pl ? (
                          <Link href={href} className="truncate hover:text-pitch">
                            {pl.fullname as string}
                          </Link>
                        ) : (
                          <span className="truncate">–</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Forum */}
      <div className="border-t border-border pt-6">
        <MatchForum fixtureId={fid} homeName={homeName} awayName={awayName} />
      </div>
    </div>
  );
}
