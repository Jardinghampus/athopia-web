import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatistikTabs } from "./StatistikTabs";
import { FavoriteTeamHighlight } from "./FavoriteTeamHighlight";
import { H2HSearch } from "./H2HSearch";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import type { H2HFixture } from "./H2HSearch";
import {
  fetchAllsvenskanFixtures,
  parseFixtureScore,
} from "@/lib/db/fixtures";
import {
  SEASON_IDS,
  type ScorerRow,
  getStandingsFromDb,
  getTopScorersFromDb,
  getTopAssistsFromDb,
  getTopXgFromDb,
  getTopXaFromDb,
  getTopRatingsFromDb,
  getTopShotsFromDb,
  getTopPassersFromDb,
  getTopDefendersFromDb,
  getMostCardsFromDb,
} from "@/lib/statistik";

// Data hämtas från Supabase (synkad av athopia-os från Sportmonks).
async function getStandings(seasonId: string) {
  return getStandingsFromDb(seasonId);
}
async function getScorers(seasonId: string) {
  return getTopScorersFromDb(seasonId);
}
async function getAssists(seasonId: string) {
  return getTopAssistsFromDb(seasonId);
}
async function getXg(seasonId: string) {
  const [xg, xa] = await Promise.all([getTopXgFromDb(seasonId), getTopXaFromDb(seasonId)]);
  return { xg, xa };
}
async function getPlayerOverview(seasonId: string) {
  const [ratings, shots, passers, defenders, cards] = await Promise.all([
    getTopRatingsFromDb(seasonId),
    getTopShotsFromDb(seasonId),
    getTopPassersFromDb(seasonId),
    getTopDefendersFromDb(seasonId),
    getMostCardsFromDb(seasonId),
  ]);
  return { ratings, shots, passers, defenders, cards };
}

export const revalidate = 300;

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
        Data synkroniseras via athopia-os. Kontrollera att sync-jobbet är igång.
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

function PlayerCell({ row }: { row: ScorerRow }) {
  const href = row.slug ? `/spelare/${row.slug}` : undefined;
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      {row.image ? (
        <Image
          src={row.image}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-full object-cover bg-muted"
          unoptimized
        />
      ) : (
        <div className="size-8 rounded-full bg-muted" />
      )}
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{row.player_name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {row.team_name}{row.position ? ` · ${row.position}` : ""}
        </span>
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="hover:text-pitch">
      {content}
    </Link>
  ) : content;
}

function fmt(value: number | null | undefined, decimals = 0) {
  if (value == null || Number.isNaN(Number(value))) return "–";
  return decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(Number(value)));
}

function PlayerLeaderboard({
  rows,
  primary,
  primaryLabel,
  primaryDecimals = 0,
  secondary,
}: {
  rows: ScorerRow[];
  primary: keyof ScorerRow;
  primaryLabel: string;
  primaryDecimals?: number;
  secondary?: Array<{ key: keyof ScorerRow; label: string; decimals?: number }>;
}) {
  if (rows.length === 0) return <EmptyState />;
  const cols = secondary ?? [
    { key: "appearances", label: "M" },
    { key: "minutes", label: "Min" },
    { key: "goals", label: "Mål" },
    { key: "assists", label: "Ast" },
    { key: "rating", label: "Betyg", decimals: 2 },
  ];

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-2 px-3 text-left w-10">#</th>
            <th className="py-2 px-3 text-left min-w-[240px]">Spelare</th>
            {cols.map((col) => (
              <th key={String(col.key)} className="py-2 px-3 text-center">{col.label}</th>
            ))}
            <th className="py-2 px-3 text-center font-bold text-foreground">{primaryLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row) => (
            <tr key={`${row.player_id}-${row.rank}`} className="border-b border-border/40 hover:bg-card/50 transition-colors">
              <td className="py-3 px-3 text-xs font-semibold tabular-nums text-muted-foreground">{row.rank}</td>
              <td className="py-3 px-3"><PlayerCell row={row} /></td>
              {cols.map((col) => (
                <td key={String(col.key)} className="py-3 px-3 text-center text-muted-foreground tabular-nums">
                  {fmt(row[col.key] as number | null, col.decimals)}
                </td>
              ))}
              <td className="py-3 px-3 text-center text-lg font-bold tabular-nums text-foreground">
                {fmt(row[primary] as number | null, primaryDecimals)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
              data-team-slug={row.team.name.toLowerCase().replace(/\s+/g, "-")}
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
  return <PlayerLeaderboard rows={scorers} primary="goals" primaryLabel="Mål" />;
}

// ── Assistligan ───────────────────────────────────────────────────────────────

async function AssistliganTab({ seasonId }: { seasonId: string }) {
  const assists = await getAssists(seasonId);
  return <PlayerLeaderboard rows={assists} primary="assists" primaryLabel="Ast" />;
}

// ── xG-tabell ─────────────────────────────────────────────────────────────────

async function XGTab({ seasonId }: { seasonId: string }) {
  const { xg, xa } = await getXg(seasonId);
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">xG-ledare</h2>
        <PlayerLeaderboard
          rows={xg}
          primary="xg"
          primaryLabel="xG"
          primaryDecimals={2}
          secondary={[
            { key: "goals", label: "Mål" },
            { key: "shots", label: "Skott" },
            { key: "shots_on_target", label: "På mål" },
            { key: "minutes", label: "Min" },
          ]}
        />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">xA-ledare</h2>
        <PlayerLeaderboard
          rows={xa}
          primary="xa"
          primaryLabel="xA"
          primaryDecimals={2}
          secondary={[
            { key: "assists", label: "Ast" },
            { key: "key_passes", label: "Nyckelpass" },
            { key: "passes", label: "Pass" },
            { key: "minutes", label: "Min" },
          ]}
        />
      </section>
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

async function PressTab({ seasonId }: { seasonId: string }) {
  const { ratings, shots, passers, defenders, cards } = await getPlayerOverview(seasonId);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Högst betyg</h2>
        <PlayerLeaderboard rows={ratings} primary="rating" primaryLabel="Betyg" primaryDecimals={2} />
      </section>
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Flest skott</h2>
          <PlayerLeaderboard rows={shots} primary="shots" primaryLabel="Skott" />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Flest passningar</h2>
          <PlayerLeaderboard rows={passers} primary="passes" primaryLabel="Pass" />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Flest tacklingar</h2>
          <PlayerLeaderboard rows={defenders} primary="tackles" primaryLabel="Tackl" />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kort</h2>
          <PlayerLeaderboard
            rows={cards}
            primary="yellow_cards"
            primaryLabel="Gula"
            secondary={[
              { key: "red_cards", label: "Röda" },
              { key: "appearances", label: "M" },
              { key: "minutes", label: "Min" },
              { key: "rating", label: "Betyg", decimals: 2 },
            ]}
          />
        </section>
      </div>
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
    case "xg":          tabContent = <XGTab seasonId={seasonId} />;          break;
    case "form":        tabContent = <FormTab seasonId={seasonId} />;        break;
    case "press":       tabContent = <PressTab seasonId={seasonId} />;       break;
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

      {/* Client-side lag-highlight */}
      <FavoriteTeamHighlight />

      {/* Innehåll */}
      <div className="w-full px-6 sm:px-8 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-bold text-5xl text-foreground">STATISTIK</h1>
            <p className="text-muted-foreground mt-1 text-sm">Allsvenskan {sasong}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/statistik/scout"
              className="px-4 py-2 rounded-lg border border-pitch text-pitch text-sm font-medium hover:bg-pitch/10 transition-colors"
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
