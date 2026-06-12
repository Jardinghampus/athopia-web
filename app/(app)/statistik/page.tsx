import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatistikTabs } from "./StatistikTabs";
import { H2HSearch } from "./H2HSearch";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import type { H2HFixture } from "./H2HSearch";
import {
  fetchStandingsFull,
  fetchTopScorers,
  fetchTopAssists,
  fetchAllsvenskanFixtures,
  parseFixtureScore,
} from "@/lib/sportsmonks";
import {
  SEASON_IDS,
  getStandingsFromDb,
  getTopScorersFromDb,
  getTopAssistsFromDb,
} from "@/lib/statistik";

// Primär källa: Supabase (fylls av Hetzner-syncen). Fallback: Sportmonks-API
// direkt — tas bort när Supabase-datan är verifierad komplett för båda säsonger.
async function getStandings(seasonId: string) {
  const db = await getStandingsFromDb(seasonId);
  if (db.length > 0) return db;
  return fetchStandingsFull(seasonId).catch(() => []);
}
async function getScorers(seasonId: string) {
  const db = await getTopScorersFromDb(seasonId);
  if (db.length > 0) return db;
  return fetchTopScorers(seasonId).catch(() => []);
}
async function getAssists(seasonId: string) {
  const db = await getTopAssistsFromDb(seasonId);
  if (db.length > 0) return db;
  return fetchTopAssists(seasonId).catch(() => []);
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Statistik | Athopia",
  description:
    "Allsvenskan-statistik — tabell, skytteliga, assistligan, xG, form, press och H2H.",
};

type TabId = "tabell" | "skytteliga" | "assistligan" | "xg" | "form" | "press" | "h2h";
const VALID_TABS: TabId[] = ["tabell", "skytteliga", "assistligan", "xg", "form", "press", "h2h"];

const VALID_SEASONS = Object.keys(SEASON_IDS);

// ── Delade komponenter ────────────────────────────────────────────────────────

function EmptyState({ message = "Data ej tillgänglig." }: { message?: string }) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-60">
        Kontrollera att SPORTSMONKS_API_TOKEN är satt i .env.local.
      </p>
    </div>
  );
}

function FormBadge({ result }: { result: string }) {
  const colorMap: Record<string, string> = {
    W: "bg-pitch text-white",
    D: "bg-muted text-muted-foreground",
    L: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
        colorMap[result] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {result}
    </span>
  );
}

function TeamCell({ name, image }: { name: string; image?: string }) {
  return (
    <div className="flex items-center gap-2">
      {image ? (
        <Image
          src={image}
          alt={name}
          width={20}
          height={20}
          className="rounded-full shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
      )}
      <span className="truncate max-w-[110px] sm:max-w-[180px]">{name}</span>
    </div>
  );
}

// ── Tabell ────────────────────────────────────────────────────────────────────

async function TabelTab({ seasonId }: { seasonId: string }) {
  const rows = await getStandings(seasonId);
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-2 px-3 text-left w-8">#</th>
            <th className="py-2 px-3 text-left min-w-[140px]">Lag</th>
            <th className="py-2 px-3 text-center">S</th>
            <th className="py-2 px-3 text-center">V</th>
            <th className="py-2 px-3 text-center">O</th>
            <th className="py-2 px-3 text-center">F</th>
            <th className="py-2 px-3 text-center hidden sm:table-cell">Mål</th>
            <th className="py-2 px-3 text-center">+/-</th>
            <th className="py-2 px-3 text-center font-bold text-foreground">P</th>
            <th className="py-2 px-3 text-center hidden md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.team.id}
              className={`border-b border-border/40 hover:bg-card/50 transition-colors ${
                i < 3 ? "text-foreground" : ""
              }`}
            >
              <td className="py-3 px-3">
                <span
                  className={`text-xs font-semibold ${
                    i < 3 ? "text-pitch" : "text-muted-foreground"
                  }`}
                >
                  {row.position}
                </span>
              </td>
              <td className="py-3 px-3 font-medium">
                <TeamCell name={row.team.name} image={row.team.image_path || undefined} />
              </td>
              <td className="py-3 px-3 text-center text-muted-foreground">{row.played}</td>
              <td className="py-3 px-3 text-center">{row.wins}</td>
              <td className="py-3 px-3 text-center">{row.draws}</td>
              <td className="py-3 px-3 text-center">{row.losses}</td>
              <td className="py-3 px-3 text-center text-muted-foreground hidden sm:table-cell">
                {row.goals_for}–{row.goals_against}
              </td>
              <td
                className={`py-3 px-3 text-center font-medium ${
                  row.goal_diff > 0
                    ? "text-pitch"
                    : row.goal_diff < 0
                    ? "text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {row.goal_diff > 0 ? "+" : ""}
                {row.goal_diff}
              </td>
              <td className="py-3 px-3 text-center font-bold">{row.points}</td>
              <td className="py-3 px-3 hidden md:table-cell">
                <div className="flex items-center gap-0.5">
                  {row.form.map((r, idx) => (
                    <FormBadge key={idx} result={r} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Skytteliga ────────────────────────────────────────────────────────────────

async function SkytteligaTab({ seasonId }: { seasonId: string }) {
  const scorers = await getScorers(seasonId);
  if (scorers.length === 0) return <EmptyState />;
  return (
    <ListGroup className="max-w-2xl">
      {scorers.slice(0, 30).map((s, i) => (
        <ListRow
          key={s.player_id || i}
          leading={<span className="text-xs tabular-nums text-muted-foreground">{s.rank}</span>}
          title={s.player_name}
          subtitle={s.team_name}
          trailing={
            <span className="flex items-center gap-2">
              {s.penalties > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {s.penalties}P
                </span>
              )}
              <span className="text-right">
                <span className="block text-xl font-bold tabular-nums leading-none text-foreground">{s.goals}</span>
                <span className="block text-[10px] text-muted-foreground">mål</span>
              </span>
            </span>
          }
        />
      ))}
    </ListGroup>
  );
}

// ── Assistligan ───────────────────────────────────────────────────────────────

async function AssistliganTab({ seasonId }: { seasonId: string }) {
  const assists = await getAssists(seasonId);
  if (assists.length === 0) return <EmptyState />;
  return (
    <ListGroup className="max-w-2xl">
      {assists.slice(0, 30).map((a, i) => (
        <ListRow
          key={a.player_id || i}
          leading={<span className="text-xs tabular-nums text-muted-foreground">{a.rank}</span>}
          title={a.player_name}
          subtitle={a.team_name}
          trailing={
            <span className="text-right">
              <span className="block text-xl font-bold tabular-nums leading-none text-foreground">{a.assists}</span>
              <span className="block text-[10px] text-muted-foreground">assist</span>
            </span>
          }
        />
      ))}
    </ListGroup>
  );
}

// ── xG-tabell ─────────────────────────────────────────────────────────────────

function XGTab() {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-sm">xG-data kräver premium-tillgång via Sportsmonks.</p>
      <p className="text-xs mt-1 opacity-60">
        Uppgradera Sportsmonks-abonnemanget för att aktivera xG-statistik.
      </p>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

async function FormTab({ seasonId }: { seasonId: string }) {
  const rows = await getStandings(seasonId);
  if (rows.length === 0) return <EmptyState />;
  const withForm = rows.filter((r) => r.form.length > 0);
  if (withForm.length === 0)
    return <EmptyState message="Formdata ej tillgänglig för säsongen." />;

  const sorted = [...withForm].sort((a, b) => {
    const ptsA = a.form
      .slice(-5)
      .reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    const ptsB = b.form
      .slice(-5)
      .reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    return ptsB - ptsA;
  });

  return (
    <ListGroup className="max-w-2xl" footer="Sorterat på poäng de senaste 5 omgångarna.">
      {sorted.map((row) => {
        const last5 = row.form.slice(-5);
        const pts = last5.reduce(
          (sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0),
          0
        );
        return (
          <ListRow
            key={row.team.id}
            title={<TeamCell name={row.team.name} image={row.team.image_path || undefined} />}
            trailing={
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  {last5.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{pts}/15 p</span>
              </span>
            }
          />
        );
      })}
    </ListGroup>
  );
}

// ── Press ─────────────────────────────────────────────────────────────────────

function PressTab() {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-sm">Press-statistik kräver data från Opta eller StatsBomb.</p>
      <p className="text-xs mt-1 opacity-60">
        Inte tillgänglig via Sportsmonks. Planerat för framtida integration.
      </p>
    </div>
  );
}

// ── H2H ───────────────────────────────────────────────────────────────────────

async function H2HTab() {
  const fixtures = await fetchAllsvenskanFixtures().catch(() => []);
  const h2hFixtures: H2HFixture[] = fixtures.map((f) => {
    const { home, away, homeGoals, awayGoals } = parseFixtureScore(f);
    return {
      id: f.id,
      date: f.starting_at,
      home_team: home?.name ?? "Okänt",
      away_team: away?.name ?? "Okänt",
      home_goals: homeGoals,
      away_goals: awayGoals,
      name: f.name ?? "",
      state: f.state?.state ?? "",
    };
  });
  return <H2HSearch fixtures={h2hFixtures} />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-12 bg-card rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const tab = (VALID_TABS.includes(sp.tab as TabId) ? sp.tab : "tabell") as TabId;
  const sasong = VALID_SEASONS.includes(sp.sasong ?? "") ? sp.sasong! : "2026";
  const seasonId = SEASON_IDS[sasong]!;

  let tabContent: React.ReactNode;
  switch (tab) {
    case "tabell":      tabContent = <TabelTab seasonId={seasonId} />;       break;
    case "skytteliga":  tabContent = <SkytteligaTab seasonId={seasonId} />;  break;
    case "assistligan": tabContent = <AssistliganTab seasonId={seasonId} />; break;
    case "xg":          tabContent = <XGTab />;          break;
    case "form":        tabContent = <FormTab seasonId={seasonId} />;        break;
    case "press":       tabContent = <PressTab />;       break;
    case "h2h":         tabContent = <H2HTab />;         break;
  }

  return (
    <div>
      {/* Sticky tab-nav + filter */}
      <Suspense
        fallback={
          <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 h-[61px]" />
        }
      >
        <StatistikTabs />
      </Suspense>

      {/* Innehåll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-heading text-5xl text-foreground">STATISTIK</h1>
            <p className="text-muted-foreground mt-1 text-sm">Allsvenskan {sasong}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/statistik/scout"
              className="px-4 py-2 rounded-lg border border-[#1D9E75] text-[#1D9E75] text-sm font-medium hover:bg-[#1D9E75]/10 transition-colors"
            >
              Scout Mode →
            </Link>
            <Link
              href="/statistik/spelare"
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Jämför spelare →
            </Link>
            <Link
              href="/statistik/jamfor"
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Jämför lag →
            </Link>
          </div>
        </div>
        <Suspense fallback={<TabSkeleton />}>{tabContent}</Suspense>
      </div>
    </div>
  );
}
