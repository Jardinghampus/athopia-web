"use client";

/**
 * FeedDashboard — Bloomberg Terminal / Football Manager style dashboard.
 * Scrollable page, 5 rows, 6-8 sections total.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Flame, ChevronRight } from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerRow {
  player_id: number;
  fullname: string;
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
  home_team_id: number;
  away_team_id: number;
}

interface UpcomingRow {
  sportmonks_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
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

interface HubPayload {
  team: { name: string; slug: string; logo_url: string | null };
  position: number | null;
  stats: {
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_diff: number;
    xg: number | null;
  } | null;
  form: ("W" | "D" | "L")[];
  topScorers: PlayerRow[];
  topAssists: PlayerRow[];
  recent: FixtureRow[];
  upcoming: UpcomingRow[];
  news: DashArticle[];
  threads: DashThread[];
  podcasts: unknown[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">{children}</p>
  );
}

function FormDot({ r }: { r: "W" | "D" | "L" }) {
  const cls = r === "W" ? "bg-emerald-500" : r === "D" ? "bg-zinc-600" : "bg-red-500";
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}

function CSSBar({ value, max, color = "bg-[#1D9E75]" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SkeletonRow() {
  return <div className="animate-pulse bg-zinc-800 rounded h-4 w-full" />;
}

// ─── Row 1: AI Brief + Position ───────────────────────────────────────────────

function AIBriefCard({ news }: { news: DashArticle[] }) {
  const ai = news.find((n) => n.is_athopia_generated);
  const topNews = news.filter((n) => !n.is_athopia_generated).slice(0, 4);

  // Build 4-5 bullet points
  const bullets: string[] = ai?.summary
    ? ai.summary.split(/\n|\.(?=\s)/).filter(Boolean).slice(0, 5).map(s => s.trim()).filter(s => s.length > 10)
    : topNews.map((n) => n.title);

  const now = new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#1D9E75]">AI Brief</span>
        <span className="text-[10px] text-zinc-500">{now}</span>
      </div>

      {bullets.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {bullets.slice(0, 5).map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300 leading-snug">
              <span className="text-[#1D9E75] shrink-0 mt-0.5">—</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Inga nyheter just nu.</p>
      )}

      {ai && (
        <div className="pt-1 border-t border-zinc-800/60">
          <Link
            href={`/artikel/${ai.slug ?? ai.id}`}
            className="text-[11px] text-[#1D9E75] hover:underline flex items-center gap-1"
          >
            Läs mer <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function PositionCard({
  team, position, stats, form,
}: {
  team: HubPayload["team"];
  position: number | null;
  stats: HubPayload["stats"];
  form: ("W" | "D" | "L")[];
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col gap-4">
      <Label>Din position</Label>

      <div className="flex items-end gap-3">
        {position != null && (
          <span className="text-2xl font-bold text-white tabular-nums">#{position}</span>
        )}
        <span className="text-sm text-zinc-300 font-medium truncate">{team.name}</span>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "P", val: stats.points },
            { label: "V", val: stats.wins },
            { label: "O", val: stats.draws },
            { label: "F", val: stats.losses },
            { label: "GM", val: stats.goals_for },
            { label: "GI", val: stats.goals_against },
          ].map(({ label, val }) => (
            <div key={label} className="bg-zinc-800/50 rounded-xl py-2">
              <p className="text-2xl font-bold text-white tabular-nums leading-none">{val}</p>
              <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form last 5 */}
      {form.length > 0 && (
        <div className="flex gap-1.5 items-center">
          {form.slice(-5).map((r, i) => <FormDot key={i} r={r} />)}
        </div>
      )}

      <Link href="/statistik" className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-auto">
        Full tabell <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─── Row 2: Upcoming, Form, Forum ─────────────────────────────────────────────

function UpcomingCard({ upcoming }: { upcoming: UpcomingRow[] }) {
  const next3 = upcoming.slice(0, 3);
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Kommande matcher</Label>
      {next3.length === 0 ? (
        <p className="text-sm text-zinc-500">Inga kommande matcher</p>
      ) : (
        <div className="flex flex-col gap-3">
          {next3.map((m) => (
            <div key={m.sportmonks_id} className="border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-sm text-zinc-300">
                <span className="truncate">{m.home_team_name}</span>
                <span className="text-zinc-600 mx-2 shrink-0">vs</span>
                <span className="truncate text-right">{m.away_team_name}</span>
              </div>
              {m.kickoff_at && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{fmtKickoff(m.kickoff_at)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LagformCard({ form, stats }: { form: ("W" | "D" | "L")[]; stats: HubPayload["stats"] }) {
  const last5 = form.slice(-5);
  const pts = last5.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Lagform</Label>
      <div className="flex gap-2 mb-3">
        {last5.map((r, i) => {
          const cls = r === "W"
            ? "bg-emerald-500/20 text-emerald-400"
            : r === "D"
            ? "bg-zinc-700/40 text-zinc-400"
            : "bg-red-500/20 text-red-400";
          return (
            <span key={i} className={`flex-1 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center ${cls}`}>
              {r}
            </span>
          );
        })}
        {last5.length === 0 && <span className="text-sm text-zinc-500">Ingen data</span>}
      </div>
      <p className="text-[11px] text-zinc-500">{pts} poäng på 5 matcher</p>
    </div>
  );
}

function ForumCard({ threads, teamSlug }: { threads: DashThread[]; teamSlug: string }) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">Forum</span>
        <Link href={`/forum/${teamSlug}`} className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5">
          Gå till forum <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {threads.length === 0 ? (
        <p className="text-sm text-zinc-500">Inga trådar ännu</p>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.slice(0, 3).map((t) => (
            <Link key={t.id} href={`/forum/${teamSlug}`} className="flex items-center justify-between gap-3 hover:opacity-80">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{t.title}</span>
              </div>
              <span className="text-sm font-bold text-white tabular-nums shrink-0">{t.reply_count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row 3: Player Explorer ────────────────────────────────────────────────────

function PlayerExplorer({ topScorers, topAssists }: { topScorers: PlayerRow[]; topAssists: PlayerRow[] }) {
  // Merge + deduplicate by player_id
  const map = new Map<number, PlayerRow>();
  [...topScorers, ...topAssists].forEach((p) => {
    const existing = map.get(p.player_id);
    if (!existing) {
      map.set(p.player_id, { ...p });
    } else {
      map.set(p.player_id, {
        ...existing,
        goals: Math.max(existing.goals, p.goals),
        assists: Math.max(existing.assists, p.assists),
        appearances: Math.max(existing.appearances, p.appearances),
      });
    }
  });
  const players = Array.from(map.values());

  const [selectedId, setSelectedId] = useState<number | null>(topScorers[0]?.player_id ?? null);
  const selected = players.find((p) => p.player_id === selectedId) ?? players[0] ?? null;

  const maxGoals = Math.max(...players.map((p) => p.goals), 1);
  const maxAssists = Math.max(...players.map((p) => p.assists), 1);

  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Player Explorer</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Picker */}
        <div>
          <select
            className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-xl px-3 py-2.5 border-0 outline-none focus:ring-1 focus:ring-[#1D9E75]"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {players.map((p) => (
              <option key={p.player_id} value={p.player_id}>{p.fullname}</option>
            ))}
          </select>
        </div>

        {/* Stat boxes */}
        {selected && (
          <div className="flex gap-3">
            {[
              { label: "Mål", val: selected.goals },
              { label: "Assist", val: selected.assists },
              { label: "Matcher", val: selected.appearances },
            ].map(({ label, val }) => (
              <div key={label} className="flex-1 bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{val}</p>
                <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* CSS bars */}
        {selected && (
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-500 w-10">Mål</span>
              <CSSBar value={selected.goals} max={maxGoals} color="bg-[#1D9E75]" />
              <span className="text-sm font-bold text-white tabular-nums w-5 text-right">{selected.goals}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-500 w-10">Assist</span>
              <CSSBar value={selected.assists} max={maxAssists} color="bg-blue-500" />
              <span className="text-sm font-bold text-white tabular-nums w-5 text-right">{selected.assists}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Row 4: Skytteliga, Assistligan, Senaste matcher ──────────────────────────

function SkyListCard({ players }: { players: PlayerRow[] }) {
  const top5 = players.slice(0, 5);
  const max = top5[0]?.goals ?? 1;
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Skytteliga top 5</Label>
      <div className="flex flex-col gap-2.5">
        {top5.map((p, i) => (
          <div key={p.player_id} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 w-3 shrink-0">{i + 1}</span>
            <span className="text-xs text-zinc-300 flex-1 truncate">{p.fullname}</span>
            <CSSBar value={p.goals} max={max} />
            <span className="text-sm font-bold text-white tabular-nums w-4 text-right shrink-0">{p.goals}</span>
          </div>
        ))}
        {top5.length === 0 && <p className="text-sm text-zinc-500">Ingen data</p>}
      </div>
    </div>
  );
}

function AssistListCard({ players }: { players: PlayerRow[] }) {
  const top5 = players.slice(0, 5);
  const max = top5[0]?.assists ?? 1;
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Assistligan top 5</Label>
      <div className="flex flex-col gap-2.5">
        {top5.map((p, i) => (
          <div key={p.player_id} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 w-3 shrink-0">{i + 1}</span>
            <span className="text-xs text-zinc-300 flex-1 truncate">{p.fullname}</span>
            <CSSBar value={p.assists} max={max} color="bg-blue-500" />
            <span className="text-sm font-bold text-white tabular-nums w-4 text-right shrink-0">{p.assists}</span>
          </div>
        ))}
        {top5.length === 0 && <p className="text-sm text-zinc-500">Ingen data</p>}
      </div>
    </div>
  );
}

function RecentMatchesCard({ recent, teamId }: { recent: FixtureRow[]; teamId: number | null }) {
  const last3 = recent.slice(0, 3);
  function result(m: FixtureRow): "V" | "O" | "F" | null {
    if (m.home_score == null || m.away_score == null) return null;
    if (teamId == null) return null;
    const isHome = m.home_team_id === teamId;
    const myGoals = isHome ? m.home_score : m.away_score;
    const theirGoals = isHome ? m.away_score : m.home_score;
    if (myGoals > theirGoals) return "V";
    if (myGoals === theirGoals) return "O";
    return "F";
  }
  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Senaste matcher</Label>
      {last3.length === 0 ? (
        <p className="text-sm text-zinc-500">Inga resultat</p>
      ) : (
        <div className="flex flex-col gap-3">
          {last3.map((m) => {
            const r = result(m);
            const badgeCls = r === "V" ? "bg-emerald-500/20 text-emerald-400" : r === "O" ? "bg-zinc-700/40 text-zinc-400" : "bg-red-500/20 text-red-400";
            return (
              <div key={m.sportmonks_id} className="flex items-center gap-3 border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                {r && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeCls}`}>{r}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{m.home_team_name} {m.home_score}–{m.away_score} {m.away_team_name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Row 5: Trending ──────────────────────────────────────────────────────────

function TrendingCard({ threads, news, teamSlug }: { threads: DashThread[]; news: DashArticle[]; teamSlug: string }) {
  const topThreads = [...threads].sort((a, b) => b.reply_count - a.reply_count).slice(0, 3);
  const recentNews = news.filter((n) => !n.is_athopia_generated).slice(0, 3);

  return (
    <div className="rounded-2xl bg-zinc-900 p-5">
      <Label>Trending</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mest diskuterat */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Mest diskuterat</p>
          <div className="flex flex-col gap-2">
            {topThreads.map((t) => (
              <Link key={t.id} href={`/forum/${teamSlug}`} className="flex items-center justify-between gap-3 hover:opacity-80">
                <span className="text-sm text-zinc-300 truncate">{t.title}</span>
                <span className="text-sm font-bold text-white tabular-nums shrink-0">{t.reply_count}</span>
              </Link>
            ))}
            {topThreads.length === 0 && <p className="text-sm text-zinc-500">Inga trådar</p>}
          </div>
        </div>

        {/* Senaste nyheter */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Senaste nyheter</p>
          <div className="flex flex-col gap-2">
            {recentNews.map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug ?? a.id}`} className="flex items-start justify-between gap-3 hover:opacity-80">
                <span className="text-sm text-zinc-300 line-clamp-1 flex-1">{a.title}</span>
                <span className="text-[11px] text-zinc-500 shrink-0">{a.published_at ? timeAgo(a.published_at) : ""}</span>
              </Link>
            ))}
            {recentNews.length === 0 && <p className="text-sm text-zinc-500">Inga nyheter</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function NoTeamState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <Trophy className="w-8 h-8 text-zinc-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Välj ditt lag</h2>
        <p className="text-sm text-zinc-500">Din personaliserade dashboard väntar.</p>
      </div>
      <Link href="/onboarding" className="px-6 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-medium hover:opacity-90 transition-opacity">
        Kom igång
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-zinc-900 p-5 flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  if (!slug || !hub) return <NoTeamState />;

  const { team, position, stats, form, topScorers, topAssists, recent, upcoming, news, threads } = hub;
  const teamSlug = team.slug;

  // Try to infer this team's sportmonks id from recent fixtures
  const teamSmId: number | null = null; // not in payload, pass null

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">

      {/* Row 1: AI Brief (8 cols) + Position (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <AIBriefCard news={news} />
        </div>
        <div className="md:col-span-4">
          <PositionCard team={team} position={position} stats={stats} form={form} />
        </div>
      </div>

      {/* Row 2: Upcoming (4) + Lagform (4) + Forum (4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UpcomingCard upcoming={upcoming} />
        <LagformCard form={form} stats={stats} />
        <ForumCard threads={threads} teamSlug={teamSlug} />
      </div>

      {/* Row 3: Player Explorer (full width) */}
      <PlayerExplorer topScorers={topScorers} topAssists={topAssists} />

      {/* Row 4: Skytteliga (4) + Assistligan (4) + Senaste matcher (4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkyListCard players={topScorers} />
        <AssistListCard players={topAssists} />
        <RecentMatchesCard recent={recent} teamId={teamSmId} />
      </div>

      {/* Row 5: Trending (full width) */}
      <TrendingCard threads={threads} news={news} teamSlug={teamSlug} />

    </div>
  );
}
