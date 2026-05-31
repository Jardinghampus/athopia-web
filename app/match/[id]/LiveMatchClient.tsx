"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── Typer ─────────────────────────────────────────────────────────────────────

interface MatchStats {
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  home_xg: number | null;
  away_xg: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  played_at: string | null;
  milo_analyzed: boolean;
}

interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
}

// ── SWR fetcher ───────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json()) as Promise<MatchStats | null>;

// ── Live xG Area Chart ────────────────────────────────────────────────────────

function LiveXgChart({ homeXg, awayXg, homeName, awayName }: {
  homeXg: number;
  awayXg: number;
  homeName: string;
  awayName: string;
}) {
  const data = [
    { name: "Start", home: 0, away: 0 },
    { name: "Nu", home: homeXg, away: awayXg },
  ];

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span className="text-[#1D9E75] font-medium">{homeName}</span>
        <span className="font-medium text-foreground">xG</span>
        <span className="text-[#3B82F6] font-medium">{awayName}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl font-bold text-[#1D9E75]">{homeXg.toFixed(2)}</span>
        <span className="text-muted-foreground text-sm flex-1 text-center">–</span>
        <span className="text-3xl font-bold text-[#3B82F6]">{awayXg.toFixed(2)}</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 11,
            }}
          />
          <ReferenceLine y={1.5} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="home" name={homeName} stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="away" name={awayName} stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Stat-rad ──────────────────────────────────────────────────────────────────

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const homeW = Math.round((home / total) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span className="font-semibold text-foreground">{home}</span>
        <span>{label}</span>
        <span className="font-semibold text-foreground">{away}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
        <div className="bg-[#1D9E75] transition-all duration-700" style={{ width: `${homeW}%` }} />
        <div className="bg-[#3B82F6] transition-all duration-700" style={{ width: `${100 - homeW}%` }} />
      </div>
    </div>
  );
}

// ── Live Forum-aktivitet ───────────────────────────────────────────────────────

function LiveForumFeed({ teamIds }: { teamIds: string[] }) {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key || teamIds.length === 0) return;

    const db = createClient(url, key);

    // Hämta senaste 15 svar från dessa lag
    void db
      .from("forum_replies")
      .select("id, content, author_name, created_at")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) setReplies((data as ForumReply[]).reverse());
      });

    // Realtime subscription
    const channel = db
      .channel("match-forum-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "forum_replies" },
        (payload) => {
          const reply = payload.new as ForumReply;
          setReplies((prev) => [...prev.slice(-29), reply]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        },
      )
      .subscribe();

    return () => { void db.removeChannel(channel); };
  }, [teamIds]);

  return (
    <div className="h-64 overflow-y-auto flex flex-col gap-2 pr-1">
      {replies.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Inga forum-inlägg än...
        </p>
      ) : (
        replies.map((r) => (
          <div key={r.id} className="bg-muted/40 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">{r.author_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{r.content}</p>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Huvud-komponent ────────────────────────────────────────────────────────────

interface LiveMatchClientProps {
  fixtureId: number;
  initialStats: MatchStats | null;
  isLive: boolean;
  teamIds: string[];
}

export function LiveMatchClient({ fixtureId, initialStats, isLive, teamIds }: LiveMatchClientProps) {
  const { data: stats } = useSWR<MatchStats | null>(
    isLive ? `/api/match/${fixtureId}` : null,
    fetcher,
    { refreshInterval: 30_000, fallbackData: initialStats },
  );

  const match = stats ?? initialStats;

  if (!match) {
    return (
      <p className="text-center py-12 text-muted-foreground text-sm">
        Ingen matchdata tillgänglig.
      </p>
    );
  }

  const homeXg = match.home_xg ?? 0;
  const awayXg = match.away_xg ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Vänster: match-statistik */}
      <div className="lg:col-span-2 space-y-4">
        {/* Resultat-header */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-bold text-foreground flex-1 text-right">
              {match.home_team_name}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-bebas)" }}>
                {match.home_score}
              </span>
              <span className="text-2xl text-muted-foreground">–</span>
              <span className="text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-bebas)" }}>
                {match.away_score}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground flex-1 text-left">
              {match.away_team_name}
            </p>
          </div>
          {isLive && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-500 font-medium uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>

        {/* xG */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Expected Goals (xG)
          </h3>
          <LiveXgChart
            homeXg={homeXg}
            awayXg={awayXg}
            homeName={match.home_team_name}
            awayName={match.away_team_name}
          />
        </div>

        {/* Statistik */}
        {(match.home_possession ?? 0) > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Matchstatistik
            </h3>
            {match.home_possession != null && (
              <StatBar label="Bollinnehav %" home={match.home_possession} away={match.away_possession ?? 0} />
            )}
            {match.home_shots != null && (
              <StatBar label="Skott" home={match.home_shots} away={match.away_shots ?? 0} />
            )}
            {match.home_shots_on_target != null && (
              <StatBar label="Skott på mål" home={match.home_shots_on_target} away={match.away_shots_on_target ?? 0} />
            )}
          </div>
        )}
      </div>

      {/* Höger: live forum */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Forum live
        </h3>
        <LiveForumFeed teamIds={teamIds} />
      </div>
    </div>
  );
}
