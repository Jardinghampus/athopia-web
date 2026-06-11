"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  RefreshCw, ChevronDown, Trophy, BarChart3, Users, CalendarDays, MessageSquare,
  Newspaper, Activity, Star, Loader2,
} from "lucide-react";
import { TeamRadar } from "@/components/team-hub/TeamRadar";
import { getStoredTeam, setStoredTeam } from "@/lib/team-hub/teamContext";
import type { TeamHubPayload, LeaderRow, FixtureRow } from "@/lib/team-hub/queries";

interface TeamListItem { name: string; slug: string; logo_url: string | null }

type TabId = "oversikt" | "statistik" | "trupp" | "matcher" | "forum";
const TABS: { id: TabId; label: string; icon: typeof Trophy }[] = [
  { id: "oversikt", label: "Översikt", icon: Activity },
  { id: "statistik", label: "Statistik", icon: BarChart3 },
  { id: "trupp", label: "Trupp", icon: Users },
  { id: "matcher", label: "Matcher", icon: CalendarDays },
  { id: "forum", label: "Forum", icon: MessageSquare },
];

export function MittLagDashboard({ teams, initialSlug }: { teams: TeamListItem[]; initialSlug: string | null }) {
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [hub, setHub] = useState<TeamHubPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("oversikt");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  // Klient-resolved stored team (om server inte hade någon).
  useEffect(() => {
    if (!slug) {
      const stored = getStoredTeam();
      if (stored?.slug) setSlug(stored.slug);
    }
  }, [slug]);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${s}/hub`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TeamHubPayload;
        setHub(data);
        setUpdatedAt(Date.now());
        setStoredTeam({ slug: data.team.slug, name: data.team.name, logo_url: data.team.logo_url });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (slug) load(slug); }, [slug, load]);

  const current = useMemo(() => teams.find((t) => t.slug === slug) ?? null, [teams, slug]);

  if (!slug) return <EmptyPicker />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* ── Header med lagväljare ─────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
          {(hub?.team.logo_url ?? current?.logo_url) && (
            <Image src={(hub?.team.logo_url ?? current?.logo_url)!} alt="" fill className="object-contain p-1.5" sizes="56px" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-pitch shrink-0" />
            <select
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setTab("oversikt"); }}
              className="font-heading text-2xl sm:text-3xl text-foreground bg-transparent border-0 focus:outline-none cursor-pointer max-w-full"
            >
              {teams.map((t) => <option key={t.slug} value={t.slug}>{t.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {hub?.position && <span className="text-xs font-bold text-pitch">#{hub.position} i Allsvenskan</span>}
            {hub && <FormDots form={hub.form} />}
          </div>
        </div>
        <button
          onClick={() => slug && load(slug)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{updatedAt ? `Uppdaterad ${secsAgo(updatedAt)}` : "Uppdatera"}</span>
        </button>
      </div>

      {/* ── Nyckeltal ─────────────────────────────────────────── */}
      {hub?.stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <KeyStat label="Poäng" value={hub.stats.points} accent />
          <KeyStat label="Spelade" value={hub.stats.played} />
          <KeyStat label="Gjorda" value={hub.stats.goals_for} />
          <KeyStat label="Insläppta" value={hub.stats.goals_against} />
          <KeyStat label="Mål­skill." value={`${hub.stats.goal_diff >= 0 ? "+" : ""}${hub.stats.goal_diff}`} />
          <KeyStat label="xG" value={hub.stats.xg != null ? Number(hub.stats.xg).toFixed(1) : "–"} />
        </div>
      )}

      {/* ── Tab-bar ───────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? "border-pitch text-pitch" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Innehåll ──────────────────────────────────────────── */}
      {loading && !hub ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !hub ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Kunde inte ladda lagdata.</p>
      ) : (
        <div className="space-y-5">
          {tab === "oversikt" && <Oversikt hub={hub} />}
          {tab === "statistik" && <Statistik hub={hub} />}
          {tab === "trupp" && <Trupp squad={hub.squad} />}
          {tab === "matcher" && <Matcher recent={hub.recent} upcoming={hub.upcoming} smId={hub.team.sportsmonks_id} />}
          {tab === "forum" && <Forum hub={hub} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Översikt ──────────────────────────────────────────────────────────
function Oversikt({ hub }: { hub: TeamHubPayload }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card title="Lagprofil mot ligan" icon={BarChart3} className="lg:col-span-2">
        <TeamRadar data={hub.radar} />
        <p className="text-[11px] text-muted-foreground text-center mt-1">Normaliserat (z-score → 0–100). 50 = ligasnitt.</p>
      </Card>

      <Card title="Ledare" icon={Trophy}>
        <LeaderList title="Skytteliga" rows={hub.topScorers} statKey="goals" suffix="mål" />
        <LeaderList title="Assist" rows={hub.topAssists} statKey="assists" suffix="ast" />
        {hub.topScorers.length === 0 && <p className="text-sm text-muted-foreground">Ingen spelardata ännu.</p>}
      </Card>

      <Card title="Senaste nyheter" icon={Newspaper} className="lg:col-span-2">
        {hub.news.length === 0 ? <p className="text-sm text-muted-foreground">Inga artiklar ännu.</p> : (
          <div className="flex flex-col gap-2">
            {hub.news.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors">
                <span className="text-sm text-foreground group-hover:text-pitch line-clamp-2">{a.title}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{a.published_at ? new Date(a.published_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card title="Händelser" icon={Activity}>
        <FixtureFeed recent={hub.recent} upcoming={hub.upcoming} smId={hub.team.sportsmonks_id} compact />
      </Card>
    </div>
  );
}

// ─── Tab: Statistik ─────────────────────────────────────────────────────────
function Statistik({ hub }: { hub: TeamHubPayload }) {
  const s = hub.stats;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Profilradar" icon={BarChart3}><TeamRadar data={hub.radar} /></Card>
      <Card title="Säsongsstatistik" icon={Trophy}>
        {!s ? <p className="text-sm text-muted-foreground">Ingen statistik ännu.</p> : (
          <div className="divide-y divide-border/40">
            <StatRow label="Tabellposition" value={hub.position ? `#${hub.position}` : "–"} />
            <StatRow label="Poäng" value={s.points} />
            <StatRow label="Vinster / Oavgjorda / Förluster" value={`${s.wins} / ${s.draws} / ${s.losses}`} />
            <StatRow label="Mål gjorda / insläppta" value={`${s.goals_for} / ${s.goals_against}`} />
            <StatRow label="Målskillnad" value={`${s.goal_diff >= 0 ? "+" : ""}${s.goal_diff}`} />
            <StatRow label="xG" value={s.xg != null ? Number(s.xg).toFixed(2) : "–"} />
            <StatRow label="Bollinnehav" value={s.possession != null ? `${Number(s.possession).toFixed(0)}%` : "–"} />
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Trupp ─────────────────────────────────────────────────────────────
function Trupp({ squad }: { squad: LeaderRow[] }) {
  if (squad.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Ingen truppdata ännu.</p>;
  return (
    <Card title="Trupp" icon={Users}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left py-2">Spelare</th>
              <th className="text-center py-2">Pos</th>
              <th className="text-center py-2">M</th>
              <th className="text-center py-2">Mål</th>
              <th className="text-center py-2">Ast</th>
            </tr>
          </thead>
          <tbody>
            {squad.map((p) => (
              <tr key={p.player_id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <td className="py-2">
                  <Link href={`/spelare/${p.slug ?? p.player_id}`} className="flex items-center gap-2 text-foreground hover:text-pitch">
                    {p.image && <span className="relative w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0"><Image src={p.image} alt="" fill className="object-cover" sizes="24px" /></span>}
                    <span className="truncate">{p.fullname}</span>
                  </Link>
                </td>
                <td className="text-center text-muted-foreground capitalize">{p.position?.slice(0, 3) ?? "–"}</td>
                <td className="text-center text-muted-foreground">{p.appearances}</td>
                <td className="text-center font-semibold text-foreground">{p.goals}</td>
                <td className="text-center text-foreground">{p.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Tab: Matcher ───────────────────────────────────────────────────────────
function Matcher({ recent, upcoming, smId }: { recent: FixtureRow[]; upcoming: FixtureRow[]; smId: number | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Kommande" icon={CalendarDays}>
        {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Inga inplanerade matcher.</p> : <FixtureFeed recent={[]} upcoming={upcoming} smId={smId} />}
      </Card>
      <Card title="Senaste resultat" icon={Activity}>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Inga spelade matcher ännu.</p> : <FixtureFeed recent={recent} upcoming={[]} smId={smId} />}
      </Card>
    </div>
  );
}

// ─── Tab: Forum ─────────────────────────────────────────────────────────────
function Forum({ hub }: { hub: TeamHubPayload }) {
  return (
    <Card title="Forum — senaste diskussioner" icon={MessageSquare} footer={<Link href={`/lag/${hub.team.slug}/forum`} className="text-sm text-muted-foreground hover:text-foreground">Till forumet →</Link>}>
      {hub.threads.length === 0 ? <p className="text-sm text-muted-foreground">Inga trådar ännu — starta en diskussion.</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hub.threads.slice(0, 8).map((t) => (
            <Link key={t.id} href={`/lag/${hub.team.slug}/forum/${t.id}`} className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors">
              <span className="text-sm text-foreground group-hover:text-pitch line-clamp-1">{t.title}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0"><MessageSquare className="h-3 w-3" /> {t.reply_count ?? 0}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Delade byggstenar ──────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, className = "", footer }: {
  title: string; icon: typeof Trophy; children: React.ReactNode; className?: string; footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-2xl border border-border bg-card flex flex-col ${className}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-4 py-3 text-left">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold text-foreground flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-4 pb-4 flex-1 space-y-4">{children}</div>}
      {open && footer && <div className="px-4 pb-3 flex justify-end">{footer}</div>}
    </div>
  );
}

function KeyStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
      <p className={`font-heading text-xl ${accent ? "text-pitch" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  const map = { W: "bg-pitch text-white", D: "bg-muted text-foreground", L: "bg-red-500/20 text-red-400" };
  if (form.length === 0) return null;
  return <div className="flex gap-1">{form.map((r, i) => <span key={i} className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${map[r]}`}>{r}</span>)}</div>;
}

function LeaderList({ title, rows, statKey, suffix }: { title: string; rows: LeaderRow[]; statKey: "goals" | "assists"; suffix: string }) {
  if (rows.length === 0 || rows.every((r) => r[statKey] === 0)) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{title}</p>
      <div className="space-y-1">
        {rows.slice(0, 3).map((r, i) => (
          <div key={r.player_id} className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground w-3">{i + 1}</span>
            {r.image && <span className="relative w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0"><Image src={r.image} alt="" fill className="object-cover" sizes="24px" /></span>}
            <Link href={`/spelare/${r.slug ?? r.player_id}`} className="flex-1 text-sm text-foreground hover:text-pitch truncate">{r.fullname}</Link>
            <span className="text-sm font-bold text-foreground">{r[statKey]}</span>
            <span className="text-[10px] text-muted-foreground w-6">{suffix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixtureFeed({ recent, upcoming, smId, compact }: { recent: FixtureRow[]; upcoming: FixtureRow[]; smId: number | null; compact?: boolean }) {
  const res = (f: FixtureRow) => {
    const isHome = f.home_team_id === smId;
    const opp = isHome ? f.away_team_name : f.home_team_name;
    const gf = (isHome ? f.home_score : f.away_score) ?? 0;
    const ga = (isHome ? f.away_score : f.home_score) ?? 0;
    return { opp, gf, ga, isHome };
  };
  return (
    <div className="space-y-1.5">
      {upcoming.map((f) => {
        const { opp, isHome } = res(f);
        return (
          <Link key={f.sportmonks_id} href={`/match/${f.sportmonks_id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
            <span className="text-[10px] font-bold text-blue-400 w-12">KOMMER</span>
            <span className="text-sm text-muted-foreground flex-1 truncate">{isHome ? "H" : "B"} · {opp}</span>
            <span className="text-[11px] text-muted-foreground">{f.kickoff_at ? new Date(f.kickoff_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}</span>
          </Link>
        );
      })}
      {recent.map((f) => {
        const { opp, gf, ga } = res(f);
        const r = gf > ga ? "V" : gf === ga ? "O" : "F";
        const color = gf > ga ? "text-pitch" : gf === ga ? "text-muted-foreground" : "text-red-400";
        return (
          <Link key={f.sportmonks_id} href={`/match/${f.sportmonks_id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
            <span className={`text-xs font-bold w-12 ${color}`}>{compact ? r : r}</span>
            <span className="text-sm text-muted-foreground flex-1 truncate">{opp}</span>
            <span className="font-heading text-sm text-foreground">{gf}–{ga}</span>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyPicker() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-pitch/10 border border-pitch/30 flex items-center justify-center mx-auto">
        <Star className="h-7 w-7 text-pitch" />
      </div>
      <div>
        <h1 className="font-heading text-3xl text-foreground">MITT LAG</h1>
        <p className="text-muted-foreground text-sm mt-2">Du har inte valt något lag ännu. Besök en lagsida så landar du här automatiskt.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/allsvenskan" className="rounded-lg bg-pitch text-white text-sm font-medium px-4 py-2.5 hover:bg-pitch/90 transition-colors">Bläddra bland lag</Link>
        <Link href="/onboarding" className="rounded-lg border border-border text-sm text-muted-foreground px-4 py-2.5 hover:text-foreground transition-colors">Välj favoritlag</Link>
      </div>
    </div>
  );
}

function secsAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s sedan`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m sedan`;
  return `${Math.floor(m / 60)}h sedan`;
}
