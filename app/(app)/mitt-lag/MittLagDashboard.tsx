"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  RefreshCw, ChevronDown, Trophy, BarChart3, Users, CalendarDays, MessageSquare,
  Newspaper, Activity, Star, ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";

// recharts är tungt — ladda radarn först när den ska visas
const TeamRadar = dynamic(
  () => import("@/components/team-hub/TeamRadar").then((m) => m.TeamRadar),
  { ssr: false, loading: () => <div className="h-64 rounded-xl skeleton-wave bg-muted/40" /> }
);
import { MittLagSkeleton } from "./MittLagSkeleton";
import { getStoredTeam, setStoredTeam } from "@/lib/team-hub/teamContext";
import type { TeamHubPayload, LeaderRow, FixtureRow } from "@/lib/team-hub/queries";
import { type Plan, canAccess } from "@/lib/access";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Card as TactileCard } from "@/components/ui/TactileCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatNumber } from "@/components/ui/StatNumber";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import { LargeTitleHeader } from "@/components/ui/LargeTitleHeader";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/TactileSheet";

interface TeamListItem { name: string; slug: string; logo_url: string | null }

type TabId = "oversikt" | "statistik" | "trupp" | "matcher" | "forum";
const TAB_OPTIONS: { value: TabId; label: string }[] = [
  { value: "oversikt", label: "Översikt" },
  { value: "statistik", label: "Statistik" },
  { value: "trupp", label: "Trupp" },
  { value: "matcher", label: "Matcher" },
  { value: "forum", label: "Forum" },
];

// Global Header är sticky h-14 (56px) — compact-raden fastnar under den.
const HEADER_OFFSET = 56;

async function fetchHub(slug: string): Promise<TeamHubPayload> {
  const res = await fetch(`/api/team/${slug}/hub`, { cache: "no-store" });
  if (!res.ok) throw new Error(`hub ${res.status}`);
  return (await res.json()) as TeamHubPayload;
}

const TAB_IDS = TAB_OPTIONS.map((t) => t.value);

export function MittLagDashboard({ teams, initialSlug, plan = "free" }: { teams: TeamListItem[]; initialSlug: string | null; plan?: Plan }) {
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [resolved, setResolved] = useState(initialSlug != null);
  const [quickview, setQuickview] = useState<FixtureRow | null>(null);

  // Aktiv flik lever i URL:en (?tab=) — bokmärkbar, delbar, överlever lagbyte.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const tab: TabId = tabParam && TAB_IDS.includes(tabParam) ? tabParam : "oversikt";
  const setTab = useCallback(
    (next: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "oversikt") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Klient-resolved stored team (om server inte hade någon).
  useEffect(() => {
    if (!slug) {
      const stored = getStoredTeam();
      if (stored?.slug) setSlug(stored.slug);
      setResolved(true);
    }
  }, [slug]);

  const { data: hub, isPending, dataUpdatedAt, refetch, isRefetching } = useQuery({
    queryKey: ["team-hub", slug],
    queryFn: () => fetchHub(slug!),
    enabled: !!slug,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (hub) setStoredTeam({ slug: hub.team.slug, name: hub.team.name, logo_url: hub.team.logo_url });
  }, [hub]);

  const current = useMemo(() => teams.find((t) => t.slug === slug) ?? null, [teams, slug]);
  const smId = hub?.team.sportsmonks_id ?? null;

  if (!slug) {
    // Innan vi hunnit läsa stored team: visa skelett, inte tom picker.
    if (!resolved) {
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <MittLagSkeleton />
        </div>
      );
    }
    return <EmptyPicker />;
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <div className="max-w-6xl mx-auto pb-6">
        {!hub && isPending ? (
          <div className="px-4 sm:px-6 py-6"><MittLagSkeleton /></div>
        ) : !hub ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Kunde inte ladda lagdata just nu.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted active:bg-muted transition-colors touch-manipulation"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Försök igen
            </button>
          </div>
        ) : (
          <>
            {/* ── Large title med lagväljare ──────────────────────── */}
            <LargeTitleHeader
              title={hub.team.name}
              stickyOffset={HEADER_OFFSET}
              actions={
                <button
                  onClick={() => refetch()}
                  aria-label="Uppdatera lagdata"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors touch-manipulation active:bg-muted"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{dataUpdatedAt ? `Uppdaterad ${secsAgo(dataUpdatedAt)}` : "Uppdatera"}</span>
                </button>
              }
              titleContent={
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
                    {(hub.team.logo_url ?? current?.logo_url) && (
                      <Image src={(hub.team.logo_url ?? current?.logo_url)!} alt="" fill className="object-contain p-1.5" sizes="56px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-pitch shrink-0" />
                      <span className="relative inline-flex min-w-0 items-center gap-1.5">
                        <select
                          value={slug}
                          aria-label="Välj lag"
                          onChange={(e) => setSlug(e.target.value)}
                          className="appearance-none text-[28px] font-bold tracking-tight text-foreground bg-transparent border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md cursor-pointer max-w-full pr-7"
                        >
                          {teams.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                        </select>
                        <ChevronDown aria-hidden className="pointer-events-none absolute right-1 h-5 w-5 text-muted-foreground" />
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {hub.position && <span className="text-xs font-bold text-pitch">#{hub.position} i Allsvenskan</span>}
                      <FormDots form={hub.form} />
                    </div>
                  </div>
                </div>
              }
            />

            <div className="px-4 sm:px-6 space-y-5">
              {/* ── Nyckeltal ────────────────────────────────────── */}
              {hub.stats && (
                <div className="space-y-2">
                  {/* 4 + 2 — håller varje chunk inom arbetsminnesgränsen */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <KeyStat label="Poäng" value={hub.stats.points} accent />
                    <KeyStat label="Spelade" value={hub.stats.played} />
                    <KeyStat label="Gjorda" value={hub.stats.goals_for} />
                    <KeyStat label="Insläppta" value={hub.stats.goals_against} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <KeyStat label="Mål­skillnad" value={hub.stats.goal_diff} signed />
                    <KeyStat label="Vinster" value={hub.stats.wins} />
                  </div>
                </div>
              )}

              {/* ── Tabbar ───────────────────────────────────────── */}
              <SegmentedControl
                aria-label="Sektioner"
                options={TAB_OPTIONS}
                value={tab}
                onChange={setTab}
              />

              {/* ── Innehåll ─────────────────────────────────────── */}
              <div className="space-y-5">
                {tab === "oversikt" && <Oversikt hub={hub} plan={plan} onFixture={setQuickview} />}
                {tab === "statistik" && <Statistik hub={hub} plan={plan} />}
                {tab === "trupp" && <Trupp squad={hub.squad} />}
                {tab === "matcher" && <Matcher recent={hub.recent} upcoming={hub.upcoming} smId={smId} onFixture={setQuickview} />}
                {tab === "forum" && <Forum hub={hub} />}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Match-quickview (Sheet) ─────────────────────────────── */}
      <MatchQuickview fixture={quickview} smId={smId} onClose={() => setQuickview(null)} />
    </PullToRefresh>
  );
}

// ─── Match-quickview Sheet ──────────────────────────────────────────────────
function MatchQuickview({ fixture, smId, onClose }: { fixture: FixtureRow | null; smId: number | null; onClose: () => void }) {
  const f = fixture;
  const played = f?.status === "FT";
  return (
    <Sheet open={!!f} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        {f && (
          <div className="space-y-5 pb-2">
            <div className="space-y-1 text-center">
              <SheetTitle>{f.home_team_name} – {f.away_team_name}</SheetTitle>
              <SheetDescription>
                {f.kickoff_at
                  ? new Date(f.kickoff_at).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
                  : "Datum ej satt"}
                {f.status === "LIVE" && " · LIVE"}
              </SheetDescription>
            </div>

            <div className="flex items-center justify-center gap-6">
              <span className="flex-1 truncate text-right text-sm font-medium">{f.home_team_name}</span>
              {played || f.status === "LIVE" ? (
                <span className="flex items-baseline gap-1.5 text-3xl font-bold tabular-nums">
                  <StatNumber value={f.home_score ?? 0} />
                  <span className="text-muted-foreground">–</span>
                  <StatNumber value={f.away_score ?? 0} />
                </span>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {f.kickoff_at ? new Date(f.kickoff_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "–"}
                </span>
              )}
              <span className="flex-1 truncate text-sm font-medium">{f.away_team_name}</span>
            </div>

            {played && smId != null && (
              <p className="text-center text-xs text-muted-foreground">
                {(() => {
                  const isHome = f.home_team_id === smId;
                  const gf = (isHome ? f.home_score : f.away_score) ?? 0;
                  const ga = (isHome ? f.away_score : f.home_score) ?? 0;
                  return gf > ga ? "Vinst" : gf === ga ? "Oavgjort" : "Förlust";
                })()}
                {" · "}{f.home_team_id === smId ? "Hemma" : "Borta"}
              </p>
            )}

            <Link
              href={`/match/${f.sportmonks_id}`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-pitch px-4 py-3 text-sm font-medium text-white transition-opacity active:opacity-80"
            >
              Till matchsidan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Tab: Översikt ──────────────────────────────────────────────────────────
function Oversikt({ hub, plan, onFixture }: { hub: TeamHubPayload; plan: Plan; onFixture: (f: FixtureRow) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <SectionCard title="Vad du behöver veta idag" icon={Star} className="lg:col-span-3">
        {canAccess("eliteBrief", plan)
          ? <TeamDailyPulse pulse={hub.pulse} />
          : <UpgradePrompt feature="eliteBrief" />}
      </SectionCard>

      <SectionCard title="Lagprofil mot ligan" icon={BarChart3} className="lg:col-span-2">
        <RadarOrEmpty data={hub.radar} />
      </SectionCard>

      <SectionCard title="Ledare" icon={Trophy}>
        <LeaderList title="Skytteliga" rows={hub.topScorers} statKey="goals" suffix="mål" />
        <LeaderList title="Assist" rows={hub.topAssists} statKey="assists" suffix="ast" />
        {hub.topScorers.length === 0 && <p className="text-sm text-muted-foreground">Ingen spelardata ännu.</p>}
      </SectionCard>

      <SectionCard title="Senaste nyheter" icon={Newspaper} className="lg:col-span-2">
        {hub.news.length === 0 ? <p className="text-sm text-muted-foreground">Inga artiklar ännu.</p> : (
          <div className="flex flex-col gap-2">
            {hub.news.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors active:bg-muted touch-manipulation">
                <span className="text-sm text-foreground group-hover:text-pitch line-clamp-2">{a.title}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{a.published_at ? new Date(a.published_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Händelser" icon={Activity}>
        <FixtureFeed recent={hub.recent} upcoming={hub.upcoming} smId={hub.team.sportsmonks_id} onFixture={onFixture} />
      </SectionCard>
    </div>
  );
}

// ─── Tab: Statistik ─────────────────────────────────────────────────────────
function Statistik({ hub, plan }: { hub: TeamHubPayload; plan: Plan }) {
  const s = hub.stats;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SectionCard title="xG-form" icon={Activity}>
        {canAccess("advancedFilter", plan)
          ? <TeamXgForm stats={s} />
          : <UpgradePrompt feature="advancedFilter" />}
      </SectionCard>
      <SectionCard title="Profilradar" icon={BarChart3}><RadarOrEmpty data={hub.radar} /></SectionCard>
      <SectionCard title="Säsongsstatistik" icon={Trophy}>
        {!s ? <p className="text-sm text-muted-foreground">Ingen statistik ännu.</p> : (
          <div className="divide-y divide-border/40">
            <StatTextRow label="Tabellposition" value={hub.position ? `#${hub.position}` : "–"} />
            <StatTextRow label="Poäng"><StatNumber value={s.points} className="text-sm" /></StatTextRow>
            <StatTextRow label="Vinster / Oavgjorda / Förluster" value={`${s.wins} / ${s.draws} / ${s.losses}`} />
            <StatTextRow label="Mål gjorda / insläppta" value={`${s.goals_for} / ${s.goals_against}`} />
            <StatTextRow label="Målskillnad"><StatNumber value={s.goal_diff} format={{ signDisplay: "exceptZero" }} className="text-sm" /></StatTextRow>
            <StatTextRow label="Bollinnehav" value={s.possession != null ? `${Number(s.possession).toFixed(0)}%` : "–"} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Tab: Trupp ─────────────────────────────────────────────────────────────
function Trupp({ squad }: { squad: LeaderRow[] }) {
  if (squad.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Ingen truppdata ännu.</p>;
  return (
    <SectionCard title="Trupp" icon={Users}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left py-2">Spelare</th>
              <th className="text-center py-2">Pos</th>
              <th className="text-center py-2">M</th>
              <th className="text-center py-2">Min</th>
              <th className="text-center py-2">Mål</th>
              <th className="text-center py-2">Ast</th>
              <th className="text-center py-2">Skott</th>
              <th className="text-center py-2">Betyg</th>
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
                <td className="text-center text-muted-foreground">{p.minutes}</td>
                <td className="text-center font-semibold text-foreground">{p.goals}</td>
                <td className="text-center text-foreground">{p.assists}</td>
                <td className="text-center text-muted-foreground">{p.shots}</td>
                <td className="text-center text-muted-foreground">{p.rating != null ? p.rating.toFixed(2) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─── Tab: Matcher ───────────────────────────────────────────────────────────
function Matcher({ recent, upcoming, smId, onFixture }: { recent: FixtureRow[]; upcoming: FixtureRow[]; smId: number | null; onFixture: (f: FixtureRow) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ListGroup header="Kommande">
        {upcoming.length === 0
          ? <p className="px-4 py-3 text-sm text-muted-foreground">Inga inplanerade matcher.</p>
          : upcoming.map((f) => <FixtureListRow key={f.sportmonks_id} fixture={f} smId={smId} onSelect={onFixture} />)}
      </ListGroup>
      <ListGroup header="Senaste resultat">
        {recent.length === 0
          ? <p className="px-4 py-3 text-sm text-muted-foreground">Inga spelade matcher ännu.</p>
          : recent.map((f) => <FixtureListRow key={f.sportmonks_id} fixture={f} smId={smId} onSelect={onFixture} />)}
      </ListGroup>
    </div>
  );
}

// ─── Tab: Forum ─────────────────────────────────────────────────────────────
function Forum({ hub }: { hub: TeamHubPayload }) {
  return (
    <SectionCard title="Forum — senaste diskussioner" icon={MessageSquare} footer={<Link href={`/lag/${hub.team.slug}/forum`} className="text-sm text-muted-foreground hover:text-foreground">Till forumet →</Link>}>
      {hub.threads.length === 0 ? <p className="text-sm text-muted-foreground">Inga trådar ännu — starta en diskussion.</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hub.threads.slice(0, 8).map((t) => (
            <Link key={t.id} href={`/lag/${hub.team.slug}/forum/${t.id}`} className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-pitch/50 transition-colors active:bg-muted touch-manipulation">
              <span className="text-sm text-foreground group-hover:text-pitch line-clamp-1">{t.title}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0"><MessageSquare className="h-3 w-3" /> {t.reply_count ?? 0}</span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Delade byggstenar ──────────────────────────────────────────────────────
/** Dagens godkända AI-brief för laget ("vad du behöver veta idag"). Elite. */
function TeamDailyPulse({ pulse }: { pulse: TeamHubPayload["pulse"] }) {
  if (!pulse) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Ingen brief publicerad för ditt lag idag. Nya kort släpps på morgonen.</p>;
  }
  const ctx = pulse.match_context_label === "pre_match" ? "Inför match"
    : pulse.match_context_label === "post_match_hold" ? "Efter match" : "Dagsläge";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-pitch/10 border border-pitch/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pitch">Athopia AI · {ctx}</span>
      </div>
      <h3 className="text-lg font-bold leading-snug text-foreground">{pulse.headline}</h3>
      {pulse.dek && <p className="text-sm font-medium text-muted-foreground">{pulse.dek}</p>}
      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{pulse.body}</p>
    </div>
  );
}

/** Lagets xG-form: skapat vs insläppt + finishing/regression-signal mot faktiska mål. */
function TeamXgForm({ stats }: { stats: TeamHubPayload["stats"] }) {
  const xgFor = stats?.xg_for;
  const xgAgainst = stats?.xg_against;
  if (xgFor == null && xgAgainst == null) {
    return <p className="py-6 text-center text-sm text-muted-foreground">xG-data saknas ännu för säsongen.</p>;
  }
  // Finishing: faktiska mål mot förväntade. >0 = överpresterar (regression väntar), <0 = otur/sämre avslut.
  const finishing = xgFor != null && stats?.goals_for != null ? stats.goals_for - xgFor : null;
  const defending = xgAgainst != null && stats?.goals_against != null ? stats.goals_against - xgAgainst : null;
  const verdict = (d: number | null) =>
    d == null ? "" : d >= 2 ? "överpresterar — regression möjlig" : d <= -2 ? "underpresterar — otur i avsluten" : "i linje med xG";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KeyStat label="xG skapat" value={xgFor != null ? +xgFor.toFixed(1) : null} accent decimals={1} />
        <KeyStat label="xG insläppt" value={xgAgainst != null ? +xgAgainst.toFixed(1) : null} decimals={1} />
      </div>
      <div className="divide-y divide-border/40">
        {finishing != null && (
          <StatTextRow label={`Mål mot xG (${stats?.goals_for ?? 0} vs ${xgFor!.toFixed(1)})`}>
            <span className={`text-sm font-semibold ${finishing >= 0 ? "text-pitch" : "text-red-400"}`}>
              {finishing >= 0 ? "+" : ""}{finishing.toFixed(1)} · {verdict(finishing)}
            </span>
          </StatTextRow>
        )}
        {defending != null && (
          <StatTextRow label={`Insläppt mot xGA (${stats?.goals_against ?? 0} vs ${xgAgainst!.toFixed(1)})`}>
            <span className={`text-sm font-semibold ${defending <= 0 ? "text-pitch" : "text-red-400"}`}>
              {defending >= 0 ? "+" : ""}{defending.toFixed(1)}
            </span>
          </StatTextRow>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">xG = förväntade mål utifrån chansernas kvalitet. Stor avvikelse mot faktiska mål signalerar tur/otur eller form som ofta normaliseras.</p>
    </div>
  );
}

function RadarOrEmpty({ data }: { data: TeamHubPayload["radar"] }) {
  if (!data || data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Profilradar visas när säsongsstatistik finns — ofta efter ett par omgångar.
      </p>
    );
  }
  return (
    <>
      <TeamRadar data={data} />
      <p className="text-[11px] text-muted-foreground text-center mt-1">Normaliserat (z-score → 0–100). 50 = ligasnitt.</p>
    </>
  );
}
function SectionCard({ title, icon: Icon, children, className = "", footer }: {
  title: string; icon: typeof Trophy; children: React.ReactNode; className?: string; footer?: React.ReactNode;
}) {
  // Collapse-state persisteras per kort-titel så valet överlever omladdning.
  const storageKey = `mittlag:card:${title}`;
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try { if (localStorage.getItem(storageKey) === "0") setOpen(false); } catch { /* SSR/privat läge */ }
  }, [storageKey]);
  const toggle = () => setOpen((o) => {
    try { localStorage.setItem(storageKey, o ? "0" : "1"); } catch { /* ignorera */ }
    return !o;
  });
  return (
    <TactileCard className={`flex flex-col ${className}`}>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center gap-2 px-4 py-3 text-left touch-manipulation select-none active:opacity-70 transition-opacity"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold text-foreground flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-4 pb-4 flex-1 space-y-4">{children}</div>}
      {open && footer && <div className="px-4 pb-3 flex justify-end">{footer}</div>}
    </TactileCard>
  );
}

function KeyStat({ label, value, accent, signed, decimals }: {
  label: string; value: number | null; accent?: boolean; signed?: boolean; decimals?: number;
}) {
  return (
    <TactileCard className="rounded-xl p-2.5 text-center">
      {value == null ? (
        <p className={`text-xl font-bold ${accent ? "text-pitch" : "text-foreground"}`}>–</p>
      ) : (
        <StatNumber
          value={value}
          format={{
            ...(signed ? { signDisplay: "exceptZero" as const } : {}),
            ...(decimals != null ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : {}),
          }}
          className={`text-xl ${accent ? "text-pitch" : "text-foreground"}`}
        />
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </TactileCard>
  );
}

function StatTextRow({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children ?? <span className="text-sm font-semibold text-foreground">{value}</span>}
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
            <span className="text-sm font-bold text-foreground tabular-nums">{r[statKey]}</span>
            <span className="text-[10px] text-muted-foreground w-6">{suffix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rad för en match — öppnar quickview-sheet vid tap. */
function FixtureListRow({ fixture: f, smId, onSelect, density }: { fixture: FixtureRow; smId: number | null; onSelect: (f: FixtureRow) => void; density?: "default" | "compact" }) {
  const isHome = f.home_team_id === smId;
  const opp = isHome ? f.away_team_name : f.home_team_name;
  const played = f.status === "FT";
  const gf = (isHome ? f.home_score : f.away_score) ?? 0;
  const ga = (isHome ? f.away_score : f.home_score) ?? 0;
  const r = gf > ga ? "V" : gf === ga ? "O" : "F";
  const color = gf > ga ? "text-pitch" : gf === ga ? "text-muted-foreground" : "text-red-400";

  return (
    <ListRow
      density={density}
      onClick={() => onSelect(f)}
      leading={
        played
          ? <span className={`text-xs font-bold ${color}`}>{r}</span>
          : f.status === "LIVE"
            ? <span className="text-[10px] font-bold text-pitch animate-pulse">LIVE</span>
            : <span className="text-[10px] font-bold text-muted-foreground">KOMMER</span>
      }
      title={`${isHome ? "H" : "B"} · ${opp}`}
      trailing={
        played
          ? <span className="text-sm font-semibold tabular-nums text-foreground">{gf}–{ga}</span>
          : <span className="text-[11px]">{f.kickoff_at ? new Date(f.kickoff_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}</span>
      }
      chevron
    />
  );
}

/** Kompakt blandat flöde (Översikt) — samma quickview. */
function FixtureFeed({ recent, upcoming, smId, onFixture }: { recent: FixtureRow[]; upcoming: FixtureRow[]; smId: number | null; onFixture: (f: FixtureRow) => void }) {
  if (recent.length === 0 && upcoming.length === 0) {
    return <p className="text-sm text-muted-foreground">Inga matcher ännu.</p>;
  }
  return (
    <div className="-mx-2 space-y-0.5">
      {[...upcoming, ...recent].map((f) => (
        <FixtureListRow key={f.sportmonks_id} fixture={f} smId={smId} onSelect={onFixture} density="compact" />
      ))}
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mitt lag</h1>
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
