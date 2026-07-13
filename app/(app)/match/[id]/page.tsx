import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured, getPodcastSignalsForEntities } from "@/lib/supabase";
import { MatchXgChart } from "./MatchXgChart";
import { MatchForum } from "./MatchForum";
import { PlayerRatingPanel, type RatablePlayer } from "./PlayerRatingPanel";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { MatchLineups } from "@/components/match/MatchLineups";
import { MatchAskPanel } from "@/components/match/MatchAskPanel";
import { PodcastSignalsPanel } from "@/components/podcast/PodcastSignalsPanel";
import { getUserPlan } from "@/lib/user-plan";
import { BlurPaywall } from "@/components/BlurPaywall";
import { fetchStandingsFull } from "@/lib/db/fixtures";
import type { SMStandingRow } from "@/lib/db/fixtures";

export const revalidate = 60;

interface PageProps { params: Promise<{ id: string }> }

async function getData(fixtureId: number) {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const [{ data: fix }, { data: tms }, { data: evts }, { data: live }, { data: lups }, { data: cqAnalysis }, { data: pms }] = await Promise.all([
    db.from("fixtures").select("*").eq("sportmonks_id", fixtureId).maybeSingle(),
    db.from("team_match_stats").select("*").eq("fixture_id", fixtureId),
    db.from("fixture_events").select("*").eq("fixture_id", fixtureId).order("minute"),
    db.from("live_scores").select("minute,events").eq("fixture_id", fixtureId).maybeSingle(),
    db.from("fixture_lineups").select("*").eq("fixture_id", fixtureId).order("starter", { ascending: false }),
    db.from("content_queue")
      .select("content,created_at")
      .eq("status", "approved")
      .filter("metadata->>type", "eq", "post_match_analysis")
      .filter("metadata->>fixture_id", "eq", String(fixtureId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("player_match_stats").select("player_id,goals,xg").eq("fixture_id", fixtureId),
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

  // Relaterade nyheter: artiklar taggade med endera lagets entity-uuid.
  let related: Array<{ id: string; title: string; slug: string; source_name: string | null; published_at: string | null }> = [];
  let teamEntityIds: string[] = [];
  const teamSmIds = [fix?.home_team_id, fix?.away_team_id].filter(Boolean) as number[];
  if (teamSmIds.length > 0) {
    const { data: ents } = await db.from("entities").select("id").eq("type", "team").in("sportmonks_id", teamSmIds);
    const entityIds = (ents ?? []).map((e: Record<string, unknown>) => e.id as string);
    teamEntityIds = entityIds;
    if (entityIds.length > 0) {
      const { data: arts } = await db
        .from("articles")
        .select("id,title,slug,source_name,published_at")
        .eq("sport", "football")
        .overlaps("entity_ids", entityIds)
        .order("published_at", { ascending: false })
        .limit(3);
      related = (arts ?? []) as typeof related;
    }
  }

  const playerStatsMap: Record<number, { goals: number | null; xg: number | null }> = {};
  for (const row of pms ?? []) {
    const pid = (row as Record<string, unknown>).player_id as number;
    playerStatsMap[pid] = {
      goals: (row as Record<string, unknown>).goals as number | null,
      xg: (row as Record<string, unknown>).xg as number | null,
    };
  }

  return { fix, tms: tms ?? [], evts: evts ?? [], live: live ?? null, lups: lupsWithPlayers, sum, playerMap, related, playerStatsMap, teamEntityIds };
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

async function getRatablePlayers(
  fixtureId: number,
  homeLup: Record<string, unknown>[],
  awayLup: Record<string, unknown>[],
  homeName: string,
  awayName: string,
): Promise<RatablePlayer[]> {
  const starters = [
    ...homeLup.map((l) => ({ l, teamName: homeName })),
    ...awayLup.map((l) => ({ l, teamName: awayName })),
  ];
  if (starters.length === 0 || !isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { userId } = await auth();
  const { data: ratings } = await db
    .from("player_ratings")
    .select("player_id, rating, clerk_user_id")
    .eq("fixture_id", fixtureId);
  const agg = new Map<number, { sum: number; n: number; mine: number | null }>();
  for (const r of (ratings ?? []) as Array<{ player_id: number; rating: number; clerk_user_id: string }>) {
    const a = agg.get(r.player_id) ?? { sum: 0, n: 0, mine: null };
    a.sum += r.rating;
    a.n += 1;
    if (userId && r.clerk_user_id === userId) a.mine = r.rating;
    agg.set(r.player_id, a);
  }
  return starters.map(({ l, teamName }) => {
    const pid = Number(l.player_id ?? 0);
    const pl = l.players as { fullname?: string } | null;
    const a = agg.get(pid);
    return {
      playerId: pid,
      name: pl?.fullname ?? `Spelare ${pid}`,
      teamName,
      avg: a && a.n > 0 ? a.sum / a.n : null,
      votes: a?.n ?? 0,
      myRating: a?.mine ?? null,
    };
  }).filter((p) => p.playerId > 0);
}

/** Tabellrader runt de två lagen (Athletic-mönstret) — max ±2 platser, alltid båda lagen med. */
function standingsExcerpt(standings: SMStandingRow[], homeTeamId: number, awayTeamId: number): SMStandingRow[] {
  const homeIdx = standings.findIndex((r) => r.team.id === homeTeamId);
  const awayIdx = standings.findIndex((r) => r.team.id === awayTeamId);
  if (homeIdx === -1 && awayIdx === -1) return [];
  const idxs = [homeIdx, awayIdx].filter((i) => i !== -1);
  const lo = Math.max(0, Math.min(...idxs) - 1);
  const hi = Math.min(standings.length - 1, Math.max(...idxs) + 1);
  return standings.slice(lo, hi + 1);
}

function FormDots({ form }: { form: string[] }) {
  if (form.length === 0) return <span className="text-xs text-muted-foreground">–</span>;
  return (
    <span className="flex gap-1">
      {form.slice(-5).map((r, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
            r === "W" ? "bg-success/20 text-success" : r === "L" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
          }`}
        >
          {r === "W" ? "V" : r === "L" ? "F" : "O"}
        </span>
      ))}
    </span>
  );
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return <p className="text-center py-16 text-muted-foreground">Ogiltigt match-ID.</p>;

  const d = await getData(fid);
  const fix = d?.fix as Record<string, unknown> | null;
  const [plan, podcastClips, standings] = await Promise.all([
    getUserPlan(),
    getPodcastSignalsForEntities(d?.teamEntityIds ?? [], {
      limit: 2,
      teamNames: fix ? [String(fix.home_team_name ?? ""), String(fix.away_team_name ?? "")] : [],
    }),
    fetchStandingsFull().catch(() => [] as SMStandingRow[]),
  ]);

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

  let evts  = (d?.evts ?? []) as Record<string, unknown>[];
  // Under live: fixture_events fylls först efter FT — använd live_scores.events.
  // Sportmonks inplay-event: {type_id, minute, player_name, related_player_name, participant_id, result}
  const liveRow = d?.live as { minute: number | null; events: unknown } | null;
  if (evts.length === 0 && Array.isArray(liveRow?.events)) {
    const LIVE_TYPE: Record<number, string> = { 14: "GOAL", 15: "OWN_GOAL", 16: "PENALTY", 17: "PENALTY_MISSED", 18: "SUBSTITUTION", 19: "YELLOWCARD", 20: "REDCARD", 21: "YELLOW_RED_CARD" };
    evts = (liveRow!.events as Record<string, unknown>[])
      .map((e) => ({
        minute: e.minute ?? null,
        event_type: LIVE_TYPE[Number(e.type_id)] ?? String(e.type_id ?? ""),
        team_id: e.participant_id ?? null,
        player_id: null,
        related_player_id: null,
        live_player_name: (e.player_name as string | null) ?? null,
        result: e.result ?? null,
      }))
      .sort((a, b) => Number(a.minute ?? 0) - Number(b.minute ?? 0));
  }
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
      <ProductEventTracker event="match_page_view" props={{ fixture_id: fid }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(matchJsonLd) }} />
      {/* Resultat-header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-xs text-muted-foreground text-center mb-3">
          Allsvenskan {kickoff ? new Date(kickoff).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }) : ""}
          {isLive && <span className="ml-2 text-red-500">● LIVE{(d?.live as { minute: number | null } | null)?.minute != null ? ` ${(d!.live as { minute: number }).minute}′` : ""}</span>}
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

      {/* AI-sammanfattning — PRO; free får bara titel-teaser i DOM */}
      {summary && (
        <BlurPaywall
          feature="aiSummaries"
          plan={plan}
          teamName={homeName}
          maxHeight="5rem"
          tease="Matchanalys — vad som faktiskt betydde något."
          preview={
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                Athopia AI · Matchanalys
              </p>
              <p className="font-semibold text-foreground line-clamp-2">
                {summaryTitle ?? `${homeName}–${awayName}`}
              </p>
            </div>
          }
        >
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-500">
              Athopia AI · Matchanalys
            </p>
            {summaryTitle && (
              <p className="mb-2 font-semibold text-foreground">{summaryTitle}</p>
            )}
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {summary}
            </p>
          </div>
        </BlurPaywall>
      )}

      {/* Inför matchen — intelligens-hub innan avspark (Athletic-mönstret) */}
      {fix.status === "NS" && (() => {
        const homeRow = standings.find((r) => r.team.id === Number(fix.home_team_id));
        const awayRow = standings.find((r) => r.team.id === Number(fix.away_team_id));
        const excerpt = standingsExcerpt(standings, Number(fix.home_team_id), Number(fix.away_team_id));
        if (!homeRow && !awayRow && excerpt.length === 0) return null;
        return (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inför matchen</h3>

            {(homeRow || awayRow) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{homeName}</p>
                    {homeRow && <p className="text-xs text-muted-foreground">{homeRow.position}:a plats · {homeRow.points}p</p>}
                  </div>
                  {homeRow && <FormDots form={homeRow.form} />}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{awayName}</p>
                    {awayRow && <p className="text-xs text-muted-foreground">{awayRow.position}:a plats · {awayRow.points}p</p>}
                  </div>
                  {awayRow && <FormDots form={awayRow.form} />}
                </div>
              </div>
            )}

            {excerpt.length > 0 && (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {excerpt.map((row) => {
                      const isMatchTeam = row.team.id === Number(fix.home_team_id) || row.team.id === Number(fix.away_team_id);
                      return (
                        <tr key={row.team.name} className={isMatchTeam ? "bg-pitch/5 font-medium" : ""}>
                          <td className="py-1.5 px-3 text-muted-foreground w-6">{row.position}</td>
                          <td className="py-1.5 px-3 text-foreground truncate">{row.team.name}</td>
                          <td className="py-1.5 px-3 text-right text-muted-foreground">{row.played} M</td>
                          <td className="py-1.5 px-3 text-right font-semibold text-foreground">{row.points}p</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

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
                  const player = (e.live_player_name as string | null) ?? eventPlayerName(playerMap, e.player_id);
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
        <MatchLineups
          homeName={homeName}
          awayName={awayName}
          homeLup={homeLup}
          awayLup={awayLup}
          playerStats={d?.playerStatsMap ?? {}}
        />
      </div>

      {/* Spelarbetyg efter FT */}
      {fix.status === "FT" && (homeLup.length > 0 || awayLup.length > 0) && (
        <PlayerRatingPanel fixtureId={fid} players={await getRatablePlayers(fid, homeLup, awayLup, homeName, awayName)} />
      )}

      {/* Relaterade nyheter */}
      {(d?.related?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Relaterade nyheter</h3>
          <div className="space-y-2">
            {d!.related.map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="group flex items-baseline justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors">
                <span className="text-sm text-foreground group-hover:text-pitch truncate">{a.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{a.source_name ?? ""}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PodcastSignalsPanel signals={podcastClips} plan={plan} title="Podcast om matchen" />

      <MatchAskPanel
        fixtureId={fid}
        homeName={homeName}
        awayName={awayName}
        homeScore={homeScore}
        awayScore={awayScore}
        status={String(fix.status ?? "NS")}
        kickoffAt={kickoff}
        plan={plan}
      />

      {/* Forum */}
      <div className="border-t border-border pt-6">
        <MatchForum fixtureId={fid} homeName={homeName} awayName={awayName} />
      </div>
    </div>
  );
}
