/**
 * app/lag/[slug]/page.tsx — Team Hub (Översikt)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modulär kortbaserad dashboard à la Football Manager för fans.
 * Header: position, form (W/D/L), 5 nyckeltal.
 * Kort: Nyckelstatistik + radar, Ledare, Nyheter, Forum, Senaste händelser.
 * ALL statistik hämtas från Sportmonks-synkade tabeller (se lib/team-hub/queries).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, BarChart3, Trophy, Newspaper, MessageSquare, Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { FollowButton } from "@/components/dashboard/follow-button";
import { isFollowing } from "@/app/actions/follows";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getTeamNews, getTeamThreads } from "@/lib/dashboard/queries";
import {
  getLeagueSeasonStats, getTeamLeaders, getTeamFixtures,
  deriveForm, normalizeAgainstLeague, type TeamSeasonRow, type FixtureRow,
} from "@/lib/team-hub/queries";
import { TeamRadar } from "@/components/team-hub/TeamRadar";
import { TeamContextTracker } from "@/components/team-hub/TeamContextTracker";

export const revalidate = 60;

interface TeamData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  sportsmonks_id: number | null;
}

async function getTeam(slug: string): Promise<TeamData | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerClient();
    const { data } = await db.from("entities").select("*").eq("type", "team").eq("slug", slug).maybeSingle();
    if (!data) return null;
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    return {
      id: String(data.id),
      name: String(data.name),
      slug: String(data.slug),
      logo_url: (meta.logo_url as string | null) ?? null,
      sportsmonks_id: (meta.sportsmonks_id as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeam(slug);
  if (!team) return { title: "Lag hittades inte" };
  return {
    title: `${team.name} — Hub | Athopia`,
    description: `Nyheter, statistik, ledare och forum för ${team.name} på Athopia.`,
    openGraph: { images: team.logo_url ? [{ url: team.logo_url }] : [] },
  };
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  const map = { W: "bg-pitch text-white", D: "bg-muted text-foreground", L: "bg-red-500/20 text-red-400" };
  if (form.length === 0) return <span className="text-xs text-muted-foreground">Ingen form ännu</span>;
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span key={i} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${map[r]}`}>{r}</span>
      ))}
    </div>
  );
}

function KeyStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className={`font-heading text-2xl ${accent ? "text-pitch" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function fixtureResult(f: FixtureRow, teamSmId: number) {
  const isHome = f.home_team_id === teamSmId;
  const opp = isHome ? f.away_team_name : f.home_team_name;
  const gf = (isHome ? f.home_score : f.away_score) ?? 0;
  const ga = (isHome ? f.away_score : f.home_score) ?? 0;
  return { opp, gf, ga, isHome };
}

export default async function TeamHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeam(slug);

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-heading text-4xl text-foreground mb-4">Lag hittades inte</h1>
        <p className="text-muted-foreground">Laget <strong>{slug}</strong> finns inte i systemet ännu.</p>
      </div>
    );
  }

  const smId = team.sportsmonks_id;
  const [league, leaders, fixtures, news, threads, following] = await Promise.all([
    smId ? getLeagueSeasonStats() : Promise.resolve([] as TeamSeasonRow[]),
    smId ? getTeamLeaders(smId) : Promise.resolve([]),
    smId ? getTeamFixtures(smId) : Promise.resolve({ recent: [], upcoming: [] }),
    getTeamNews(slug),
    getTeamThreads(team.id),
    isFollowing(team.id),
  ]);

  const myStats = league.find((t) => t.team_id === smId) ?? null;
  // Position: explicit kolumn om finns, annars härled från poäng-rankad liga.
  const sorted = [...league].sort((a, b) => (b.points - a.points) || (b.goal_diff - a.goal_diff));
  const position = myStats?.position ?? (myStats ? sorted.findIndex((t) => t.team_id === smId) + 1 : null);

  const form = deriveForm(fixtures.recent, smId ?? -1);
  const topScorers = [...leaders].sort((a, b) => b.goals - a.goals).slice(0, 3);
  const topAssists = [...leaders].sort((a, b) => b.assists - a.assists).slice(0, 3);

  const radar = myStats
    ? normalizeAgainstLeague(league, myStats, [
        { key: "goals_for", label: "Anfall" },
        { key: "goals_against", label: "Försvar", invert: true },
        { key: "points", label: "Poäng" },
        { key: "xg", label: "xG" },
        { key: "possession", label: "Boll%" },
        { key: "goal_diff", label: "Målskillnad" },
      ])
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <TeamContextTracker slug={team.slug} name={team.name} logo_url={team.logo_url} />
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-5">
        {team.logo_url && (
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
            <Image src={team.logo_url} alt={`${team.name} logotyp`} fill className="object-contain p-2" sizes="80px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl sm:text-5xl text-foreground leading-none">{team.name.toUpperCase()}</h1>
              {position && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-bold text-pitch">#{position}</span> i Allsvenskan
                </p>
              )}
            </div>
            <FollowButton entityId={team.id} initialFollowing={following} />
          </div>
          <div className="mt-3"><FormDots form={form} /></div>
        </div>
      </div>

      {/* ── Nyckeltal ──────────────────────────────────────────── */}
      {myStats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          <KeyStat label="Poäng" value={myStats.points} accent />
          <KeyStat label="Spelade" value={myStats.played} />
          <KeyStat label="Gjorda" value={myStats.goals_for} />
          <KeyStat label="Insläppta" value={myStats.goals_against} />
          <KeyStat label="Målskillnad" value={`${myStats.goal_diff >= 0 ? "+" : ""}${myStats.goal_diff}`} />
          <KeyStat label="xG" value={myStats.xg != null ? Number(myStats.xg).toFixed(1) : "–"} />
        </div>
      )}

      {/* ── Kort-dashboard ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Statistik-snapshot + radar */}
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Lagprofil mot ligan</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <TeamRadar data={radar} />
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              Normaliserat (z-score → 0–100) mot ligasnittet. 50 = snitt.
            </p>
          </CardContent>
          <CardFooter className="pt-2">
            <Link href={`/lag/${slug}/statistik`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground">
              Full statistik <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Ledare */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Ledare</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <LeaderList title="Skytteliga" rows={topScorers} statKey="goals" suffix="mål" />
            <LeaderList title="Assist" rows={topAssists} statKey="assists" suffix="ast" />
            {leaders.length === 0 && <p className="text-sm text-muted-foreground">Ingen spelardata ännu.</p>}
          </CardContent>
        </Card>

        {/* Nyheter */}
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Senaste nyheter</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {news.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga artiklar för {team.name} ännu.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {news.slice(0, 4).map((a) => (
                  <Link key={a.id} href={`/artikel/${a.slug}`} className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors">
                    <span className="text-sm text-foreground group-hover:text-pitch line-clamp-2">{a.title}</span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {a.published_at ? new Date(a.published_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Link href={`/lag/${slug}/nyheter`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground">
              Alla nyheter <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Senaste händelser (fixtures-timeline) */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Händelser</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-1.5">
            {fixtures.upcoming.map((f) => {
              const { opp, isHome } = fixtureResult(f, smId ?? -1);
              return (
                <Link key={f.sportmonks_id} href={`/match/${f.sportmonks_id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                  <span className="text-[10px] font-bold text-blue-400 w-10">KOMMER</span>
                  <span className="text-sm text-muted-foreground flex-1 truncate">{isHome ? "H" : "B"} · {opp}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {f.kickoff_at ? new Date(f.kickoff_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}
                  </span>
                </Link>
              );
            })}
            {fixtures.recent.map((f) => {
              const { opp, gf, ga } = fixtureResult(f, smId ?? -1);
              const res = gf > ga ? "V" : gf === ga ? "O" : "F";
              const color = gf > ga ? "text-pitch" : gf === ga ? "text-muted-foreground" : "text-red-400";
              return (
                <Link key={f.sportmonks_id} href={`/match/${f.sportmonks_id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
                  <span className={`text-xs font-bold w-10 ${color}`}>{res}</span>
                  <span className="text-sm text-muted-foreground flex-1 truncate">{opp}</span>
                  <span className="font-heading text-sm text-foreground">{gf}–{ga}</span>
                </Link>
              );
            })}
            {fixtures.recent.length === 0 && fixtures.upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Inga matcher ännu.</p>
            )}
          </CardContent>
        </Card>

        {/* Forum */}
        <Card className="flex flex-col lg:col-span-3">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Forum — senaste diskussioner</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga trådar ännu — starta en diskussion.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {threads.slice(0, 6).map((t) => (
                  <Link key={t.id} href={`/lag/${slug}/forum/${t.id}`} className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors">
                    <span className="text-sm text-foreground group-hover:text-pitch line-clamp-1">{t.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <MessageSquare className="h-3 w-3" /> {t.reply_count ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Link href={`/lag/${slug}/forum`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground">
              Till forumet <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {!myStats && leaders.length === 0 && news.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {smId ? "Statistik synkas in från Sportmonks — kom tillbaka snart." : "Detta lag saknar Sportmonks-koppling ännu."}
        </p>
      )}
    </div>
  );
}

function LeaderList({ title, rows, statKey, suffix }: {
  title: string;
  rows: { player_id: number; fullname: string; slug: string | null; image: string | null; goals: number; assists: number }[];
  statKey: "goals" | "assists";
  suffix: string;
}) {
  if (rows.length === 0 || rows.every((r) => r[statKey] === 0)) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{title}</p>
      <div className="space-y-1">
        {rows.map((r, i) => {
          const playerSlug = r.slug ?? String(r.player_id);
          return (
            <div key={r.player_id} className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground w-3">{i + 1}</span>
              {r.image && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                  <Image src={r.image} alt="" fill className="object-cover" sizes="24px" />
                </div>
              )}
              <Link href={`/spelare/${playerSlug}`} className="flex-1 text-sm text-foreground hover:text-pitch truncate">{r.fullname}</Link>
              <span className="text-sm font-bold text-foreground">{r[statKey]}</span>
              <span className="text-[10px] text-muted-foreground w-6">{suffix}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
