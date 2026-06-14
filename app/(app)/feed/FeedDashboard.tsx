"use client";

/**
 * FeedDashboard — bento-grid dashboard för Athopia feed.
 * Full viewport, inga scrolls (utom inom cards).
 * Laddar team-data via SWR mot /api/feed/hub efter att favoriteTeam är känt.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Newspaper, MessageSquare, Mic, TrendingUp,
  Trophy, Target, Zap, Brain, ArrowRight, Clock,
  ChevronRight,
} from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import type { FeedItem } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderRow {
  player_id: number;
  fullname: string;
  slug: string | null;
  image: string | null;
  goals: number;
  assists: number;
  appearances: number;
}

interface FixtureRow {
  sportmonks_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  status: string;
  home_team_id: number;
  away_team_id: number;
}

interface DashThread {
  id: string;
  title: string;
  reply_count: number;
  created_at: string;
}

interface DashArticle {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  source_name: string | null;
  published_at: string | null;
  is_athopia_generated?: boolean;
}

interface Podcast {
  id: string;
  show_name: string;
  title: string;
  duration_seconds: number;
  published_at: string;
}

interface TeamStats {
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  xg: number | null;
  possession: number | null;
}

interface HubPayload {
  team: { name: string; slug: string; logo_url: string | null };
  position: number | null;
  stats: TeamStats | null;
  form: ("W" | "D" | "L")[];
  topScorers: LeaderRow[];
  topAssists: LeaderRow[];
  recent: FixtureRow[];
  upcoming: FixtureRow[];
  news: DashArticle[];
  threads: DashThread[];
  podcasts: Podcast[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmt(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 animate-pulse ${className}`} />
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function FormDot({ r }: { r: "W" | "D" | "L" }) {
  const cls = r === "W" ? "bg-emerald-500" : r === "D" ? "bg-zinc-500" : "bg-red-500";
  return <span className={`w-2 h-2 rounded-full ${cls}`} />;
}

/** Hero: AI-sammanfattning + senaste nyhet */
function NewsHeroCard({ news, smId }: { news: DashArticle[]; smId: string | null }) {
  const ai = news.find((n) => n.is_athopia_generated);
  const latest = news.filter((n) => !n.is_athopia_generated).slice(0, 4);

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* AI summary */}
      {ai && (
        <Link
          href={`/artikel/${ai.slug ?? ai.id}`}
          className="group block rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-transparent p-4 shrink-0 hover:border-amber-500/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">AI-analys</span>
            {ai.published_at && (
              <span className="ml-auto text-[10px] text-zinc-500">{timeAgo(ai.published_at)}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            {ai.title}
          </p>
          {ai.summary && (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{ai.summary}</p>
          )}
        </Link>
      )}

      {/* Latest news list */}
      <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Newspaper className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Senaste</span>
        </div>
        {latest.map((a) => (
          <Link
            key={a.id}
            href={`/artikel/${a.slug ?? a.id}`}
            className="group flex items-start justify-between gap-2 rounded-xl border border-zinc-800/60 px-3 py-2 hover:border-zinc-700 hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs text-zinc-200 group-hover:text-white line-clamp-2 leading-snug flex-1">
              {a.title}
            </span>
            <span className="text-[10px] text-zinc-600 shrink-0 whitespace-nowrap mt-0.5">
              {a.published_at ? timeAgo(a.published_at) : ""}
            </span>
          </Link>
        ))}
        {latest.length === 0 && !ai && (
          <p className="text-xs text-zinc-600 py-4 text-center">Inga nyheter ännu</p>
        )}
      </div>
    </div>
  );
}

/** Ligatabell (top 6 med lagnamn + poäng) */
function StandingsCard({ stats, position, teamName }: { stats: TeamStats | null; position: number | null; teamName: string }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-zinc-600">Tabelldata saknas</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1.5 mb-3">
        <Trophy className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Allsvenskan</span>
        {position && (
          <span className="ml-auto text-xs font-bold text-pitch">#{position}</span>
        )}
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "P", value: stats.points, accent: true },
          { label: "V", value: stats.wins },
          { label: "O", value: stats.draws },
          { label: "F", value: stats.losses },
          { label: "GM", value: stats.goals_for },
          { label: "GI", value: stats.goals_against },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-xl bg-zinc-800/60 p-2 text-center">
            <p className={`text-lg font-bold tabular-nums leading-none ${accent ? "text-pitch" : "text-white"}`}>{value}</p>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase">{label}</p>
          </div>
        ))}
      </div>

      {/* xG + possession */}
      {(stats.xg != null || stats.possession != null) && (
        <div className="flex gap-2">
          {stats.xg != null && (
            <div className="flex-1 rounded-xl bg-zinc-800/60 p-2 text-center">
              <p className="text-base font-bold text-white tabular-nums">{Number(stats.xg).toFixed(1)}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">xG</p>
            </div>
          )}
          {stats.possession != null && (
            <div className="flex-1 rounded-xl bg-zinc-800/60 p-2 text-center">
              <p className="text-base font-bold text-white tabular-nums">{Math.round(Number(stats.possession))}%</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Bollinnehav</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-3">
        <Link href="/statistik" className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
          Full tabell <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

/** Mini bar chart för top-3 spelare */
function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-pitch transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScorersCard({ scorers, teamSlug }: { scorers: LeaderRow[]; teamSlug: string }) {
  const top = scorers.slice(0, 3);
  const max = top[0]?.goals ?? 0;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <Target className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Skytteliga</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-zinc-600 flex-1 flex items-center justify-center">Ingen data</p>
      ) : (
        <div className="flex flex-col gap-3 flex-1">
          {top.map((p, i) => (
            <div key={p.player_id} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 w-3 shrink-0">{i + 1}</span>
              <span className="text-xs text-zinc-200 flex-1 truncate leading-none">{p.fullname}</span>
              <MiniBar value={p.goals} max={max} />
              <span className="text-sm font-bold tabular-nums text-white w-5 text-right shrink-0">{p.goals}</span>
            </div>
          ))}
        </div>
      )}
      <Link href={`/lag/${teamSlug}/statistik`} className="mt-3 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
        Se alla <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function AssistsCard({ assists, teamSlug }: { assists: LeaderRow[]; teamSlug: string }) {
  const top = assists.slice(0, 3);
  const max = top[0]?.assists ?? 0;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Assistligan</span>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-zinc-600 flex-1 flex items-center justify-center">Ingen data</p>
      ) : (
        <div className="flex flex-col gap-3 flex-1">
          {top.map((p, i) => (
            <div key={p.player_id} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 w-3 shrink-0">{i + 1}</span>
              <span className="text-xs text-zinc-200 flex-1 truncate leading-none">{p.fullname}</span>
              <MiniBar value={p.assists} max={max} />
              <span className="text-sm font-bold tabular-nums text-white w-5 text-right shrink-0">{p.assists}</span>
            </div>
          ))}
        </div>
      )}
      <Link href={`/lag/${teamSlug}/statistik`} className="mt-3 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
        Se alla <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/** Form + nästa match */
function FormCard({ form, upcoming, teamSlug, teamSmId }: {
  form: ("W" | "D" | "L")[];
  upcoming: FixtureRow[];
  teamSlug: string;
  teamSmId: number | null;
}) {
  const next = upcoming[0] ?? null;
  const pts5 = form.slice(-5).reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Form */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Form</span>
          <span className="ml-auto text-[10px] text-zinc-500">{pts5}/15 p</span>
        </div>
        <div className="flex gap-1.5">
          {form.slice(-5).map((r, i) => {
            const cls = r === "W" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : r === "D" ? "bg-zinc-700/40 text-zinc-400 border-zinc-600/30"
              : "bg-red-500/20 text-red-400 border-red-500/30";
            return (
              <span key={i} className={`flex-1 h-8 rounded-lg border text-[11px] font-bold flex items-center justify-center ${cls}`}>
                {r}
              </span>
            );
          })}
          {form.length === 0 && <span className="text-xs text-zinc-600">Inga matcher</span>}
        </div>
      </div>

      {/* Next match */}
      {next && (
        <Link href={`/match/${next.sportmonks_id}`} className="group rounded-xl border border-zinc-800 bg-zinc-800/40 px-3 py-2.5 hover:border-zinc-700 transition-colors">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 mb-1.5">Nästa match</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-200 truncate">{next.home_team_name}</span>
            <span className="text-[10px] text-zinc-600 shrink-0">vs</span>
            <span className="text-xs text-zinc-200 truncate text-right">{next.away_team_name}</span>
          </div>
          {next.kickoff_at && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-500">
              <Clock className="w-2.5 h-2.5" />
              {new Date(next.kickoff_at).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          )}
        </Link>
      )}
    </div>
  );
}

function ForumCard({ threads, teamSlug }: { threads: DashThread[]; teamSlug: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Forum</span>
        <Link href={`/forum/${teamSlug}`} className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-0.5 transition-colors">
          Allt <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {threads.length === 0 ? (
        <p className="text-xs text-zinc-600 flex-1 flex items-center justify-center">Inga trådar ännu</p>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {threads.slice(0, 4).map((t) => (
            <Link
              key={t.id}
              href={`/forum/${teamSlug}`}
              className="group flex items-center justify-between gap-2 rounded-xl border border-zinc-800/60 px-3 py-2 hover:border-zinc-700 hover:bg-zinc-800/30 transition-colors"
            >
              <span className="text-xs text-zinc-300 group-hover:text-white line-clamp-1 flex-1">{t.title}</span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0">
                <MessageSquare className="w-2.5 h-2.5" />{t.reply_count}
              </span>
            </Link>
          ))}
        </div>
      )}
      <Link
        href={`/forum/${teamSlug}/new`}
        className="mt-3 w-full rounded-xl border border-zinc-700/50 py-2 text-center text-[11px] text-zinc-500 hover:border-pitch/40 hover:text-pitch transition-colors"
      >
        + Ny tråd
      </Link>
    </div>
  );
}

function PodcastsCard({ podcasts }: { podcasts: Podcast[] }) {
  const top = podcasts.slice(0, 3);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <Mic className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Podcasts</span>
        <Link href="/podcasts" className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-0.5 transition-colors">
          Alla <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-zinc-600 flex-1 flex items-center justify-center">Inga podcasts</p>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {top.map((p) => (
            <div key={p.id} className="rounded-xl border border-zinc-800/60 px-3 py-2">
              <p className="text-[10px] text-zinc-500 truncate">{p.show_name}</p>
              <p className="text-xs text-zinc-200 line-clamp-2 leading-snug mt-0.5">{p.title}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-600">
                <Clock className="w-2.5 h-2.5" />
                {fmt(p.duration_seconds)}
                <span className="ml-auto">{timeAgo(p.published_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── No-team state ────────────────────────────────────────────────────────────

function NoTeamState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <Trophy className="w-8 h-8 text-zinc-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Välj ditt lag</h2>
        <p className="text-sm text-zinc-500">Din personaliserade dashboard väntar.</p>
      </div>
      <Link
        href="/onboarding"
        className="px-6 py-2.5 rounded-xl bg-pitch text-white text-sm font-medium hover:bg-pitch/90 transition-colors"
      >
        Kom igång
      </Link>
    </div>
  );
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="h-[calc(100dvh-57px)] p-3 grid gap-2.5"
      style={{ gridTemplateColumns: "1fr 220px", gridTemplateRows: "1fr auto auto" }}>
      <CardSkeleton />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 animate-pulse" style={{ gridRow: "1 / 4" }} />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function FeedDashboard() {
  const { slug, isLoaded } = useFavoriteTeam();
  const [hub, setHub] = useState<HubPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !slug) return;
    setLoading(true);
    fetch(`/api/feed/hub?team=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => { setHub(data as HubPayload); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoaded, slug]);

  if (!isLoaded || loading) return <DashboardSkeleton />;
  if (!slug || !hub) return (
    <div className="h-[calc(100dvh-57px)]">
      <NoTeamState />
    </div>
  );

  const teamSlug = hub.team.slug;
  const smId = hub.team ? (null as number | null) : null; // smId not in payload but not needed here

  return (
    <div
      className="h-[calc(100dvh-57px)] overflow-hidden p-2.5 sm:p-3"
    >
      {/* ── Desktop bento grid ────────────────────────────────── */}
      <div
        className="hidden lg:grid h-full gap-2.5"
        style={{
          gridTemplateColumns: "1fr 1fr 220px",
          gridTemplateRows: "1.4fr 1fr 1fr",
        }}
      >
        {/* R1C1-2: Hero news (spans 2 cols) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden" style={{ gridColumn: "1 / 3" }}>
          <NewsHeroCard news={hub.news} smId={null} />
        </div>

        {/* R1C3: Standings (spans 3 rows) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden" style={{ gridRow: "1 / 4" }}>
          <StandingsCard stats={hub.stats} position={hub.position} teamName={hub.team.name} />
        </div>

        {/* R2C1: Scorers */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
          <ScorersCard scorers={hub.topScorers} teamSlug={teamSlug} />
        </div>

        {/* R2C2: Assists */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
          <AssistsCard assists={hub.topAssists} teamSlug={teamSlug} />
        </div>

        {/* R3C1: Form + next match */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
          <FormCard form={hub.form} upcoming={hub.upcoming} teamSlug={teamSlug} teamSmId={null} />
        </div>

        {/* R3C2: Forum */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
          <ForumCard threads={hub.threads} teamSlug={teamSlug} />
        </div>
      </div>

      {/* ── Mobile: 2-col bento grid ──────────────────────────── */}
      <div
        className="lg:hidden h-full overflow-y-auto grid gap-2.5 pb-2"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Team header */}
        <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Dashboard</p>
            <h1 className="font-heading text-xl text-white leading-tight">{hub.team.name.toUpperCase()}</h1>
          </div>
          {hub.position && (
            <div className="text-right">
              <p className="font-heading text-3xl text-pitch leading-none">#{hub.position}</p>
              <p className="text-[10px] text-zinc-500">Allsvenskan</p>
            </div>
          )}
        </div>

        {/* AI summary — full width */}
        {hub.news.find(n => n.is_athopia_generated) && (
          <div className="col-span-2 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-transparent p-4">
            {(() => {
              const ai = hub.news.find(n => n.is_athopia_generated)!;
              return (
                <Link href={`/artikel/${ai.slug ?? ai.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">AI-analys</span>
                  </div>
                  <p className="text-sm font-semibold text-white line-clamp-2">{ai.title}</p>
                </Link>
              );
            })()}
          </div>
        )}

        {/* Stats mini */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <StandingsCard stats={hub.stats} position={hub.position} teamName={hub.team.name} />
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <FormCard form={hub.form} upcoming={hub.upcoming} teamSlug={teamSlug} teamSmId={null} />
        </div>

        {/* Scorers */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <ScorersCard scorers={hub.topScorers} teamSlug={teamSlug} />
        </div>

        {/* Assists */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <AssistsCard assists={hub.topAssists} teamSlug={teamSlug} />
        </div>

        {/* News */}
        <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Newspaper className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nyheter</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {hub.news.filter(n => !n.is_athopia_generated).slice(0, 3).map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug ?? a.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800/60 px-3 py-2 hover:bg-zinc-800/40 transition-colors">
                <span className="text-xs text-zinc-300 line-clamp-1 flex-1">{a.title}</span>
                <span className="text-[10px] text-zinc-600 shrink-0">{a.published_at ? timeAgo(a.published_at) : ""}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Forum */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <ForumCard threads={hub.threads} teamSlug={teamSlug} />
        </div>

        {/* Podcasts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <PodcastsCard podcasts={hub.podcasts ?? []} />
        </div>
      </div>
    </div>
  );
}
