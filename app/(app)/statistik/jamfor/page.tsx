import type { Metadata } from "next";
import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchStandingsFull } from "@/lib/db/fixtures";
import { TeamSearchBar } from "./TeamSearchBar";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { a, b } = await searchParams;
  if (a && b) {
    return {
      title: `${a} vs ${b} — Statistikjämförelse | Athopia`,
      description: `Form, H2H och nyckelstatistik för ${a} och ${b} i Allsvenskan.`,
    };
  }
  return {
    title: "Statistikjämförelse | Athopia",
    description: "Jämför Allsvenskan-lag sida vid sida — form, H2H och nyckeltal.",
  };
}

// ── Datahämtning ───────────────────────────────────────────────────────────────

interface TeamStats {
  name: string;
  slug: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  form: string[];
}

interface MatchRow {
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  played_at: string | null;
}

async function getTeamStats(slug: string): Promise<TeamStats | null> {
  if (!isSupabaseConfigured()) return null;

  const db = createServerClient();

  // Hämta entity för detta lag
  const { data: entity } = await db
    .from("entities")
    .select("id, name, slug, metadata")
    .eq("slug", slug)
    .eq("type", "team")
    .single();

  if (!entity) return null;

  const meta = entity.metadata as Record<string, unknown> | null;
  const sportsmonksId = meta?.["sportsmonks_id"] as number | undefined;

  // Hämta match_stats för laget
  let matches: MatchRow[] = [];
  if (sportsmonksId) {
    const { data } = await db
      .from("match_stats")
      .select(
        "home_team_name, away_team_name, home_score, away_score, played_at",
      )
      .or(
        `home_sportsmonks_id.eq.${sportsmonksId},away_sportsmonks_id.eq.${sportsmonksId}`,
      )
      .not("played_at", "is", null)
      .order("played_at", { ascending: true })
      .limit(20);
    matches = (data ?? []) as MatchRow[];
  }

  // Beräkna aggregat
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const form: string[] = [];

  for (const m of matches) {
    const isHome = m.home_team_name.toLowerCase() === (entity.name as string).toLowerCase();
    const myGoals = isHome ? m.home_score : m.away_score;
    const oppGoals = isHome ? m.away_score : m.home_score;

    goalsFor += myGoals;
    goalsAgainst += oppGoals;

    if (myGoals > oppGoals) won++;
    else if (myGoals === oppGoals) drawn++;
    else lost++;

    form.push(myGoals > oppGoals ? "W" : myGoals === oppGoals ? "D" : "L");
  }

  // Försök hämta standings från Sportsmonks för position och poäng
  let position = 0;
  let points = won * 3 + drawn;

  try {
    const standings = await fetchStandingsFull();
    const teamName = (entity.name as string).toLowerCase();
    const standing = standings.find(
      (s) =>
        s.team.name.toLowerCase() === teamName ||
        s.team.name.toLowerCase().includes(teamName.split(" ")[0] ?? ""),
    );
    if (standing) {
      position = standing.position;
      points = standing.points;
    }
  } catch {
    // Sportsmonks ej konfigurerat — använd beräknade värden
  }

  return {
    name: entity.name as string,
    slug: entity.slug as string,
    position,
    points,
    played: matches.length,
    won,
    drawn,
    lost,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_diff: goalsFor - goalsAgainst,
    form: form.slice(-5),
  };
}

async function getAiAnalysis(slugA: string, slugB: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();

  const { data } = await db
    .from("content_queue")
    .select("content")
    .eq("content_type", "digest")
    .contains("metadata", { subtype: "comparison", team_a: slugA, team_b: slugB })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  const content = data.content as Record<string, unknown>;
  return (content?.["text"] as string | undefined) ?? null;
}

async function getTeamList(): Promise<{ name: string; slug: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("entities")
    .select("name, slug")
    .eq("type", "team")
    .not("slug", "is", null)
    .order("name");
  return (data ?? []) as { name: string; slug: string }[];
}

// ── Stat-rad ──────────────────────────────────────────────────────────────────

function StatRow({
  label,
  a,
  b,
  higherIsBetter = true,
}: {
  label: string;
  a: number;
  b: number;
  higherIsBetter?: boolean;
}) {
  const aWins = higherIsBetter ? a > b : a < b;
  const bWins = higherIsBetter ? b > a : b < a;

  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-border/40 last:border-0">
      <span
        className={`text-sm font-semibold text-right pr-4 ${aWins ? "text-pitch" : "text-foreground"}`}
      >
        {a}
      </span>
      <span className="text-xs text-center text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold text-left pl-4 ${bWins ? "text-[#3B82F6]" : "text-foreground"}`}
      >
        {b}
      </span>
    </div>
  );
}

function FormRow({ label, a, b }: { label: string; a: string[]; b: string[] }) {
  const Badge = ({ r }: { r: string }) => {
    const color =
      r === "W" ? "bg-pitch text-white" : r === "D" ? "bg-muted text-muted-foreground" : "bg-red-500/20 text-red-400";
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${color}`}>
        {r}
      </span>
    );
  };
  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-border/40 last:border-0">
      <div className="flex gap-1 justify-end pr-4">
        {a.length ? a.map((r, i) => <Badge key={i} r={r} />) : <span className="text-xs text-muted-foreground">—</span>}
      </div>
      <span className="text-xs text-center text-muted-foreground">{label}</span>
      <div className="flex gap-1 pl-4">
        {b.length ? b.map((r, i) => <Badge key={i} r={r} />) : <span className="text-xs text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

// ── Sida ──────────────────────────────────────────────────────────────────────

export default async function JamforPage({ searchParams }: PageProps) {
  const { a: slugA, b: slugB } = await searchParams;
  const teams = await getTeamList();

  let statsA: TeamStats | null = null;
  let statsB: TeamStats | null = null;
  let aiAnalysis: string | null = null;

  if (slugA && slugB && slugA !== slugB) {
    [statsA, statsB, aiAnalysis] = await Promise.all([
      getTeamStats(slugA),
      getTeamStats(slugB),
      getAiAnalysis(slugA, slugB),
    ]);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-4xl font-bold text-foreground mb-1"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          STATISTIKJÄMFÖRELSE
        </h1>
        <p className="text-muted-foreground text-sm">
          Form, tabelläge och nyckeltal sida vid sida.
        </p>
      </div>

      {/* Sök-bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Suspense fallback={null}>
          <TeamSearchBar teams={teams} />
        </Suspense>
      </div>

      {/* Inget valt */}
      {(!slugA || !slugB) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Välj två lag att jämföra</p>
          <p className="text-sm mt-1">Välj lag A och lag B i formuläret ovan.</p>
        </div>
      )}

      {/* Resultat */}
      {statsA && statsB && (
        <div className="space-y-6">
          {/* Lagrubriker */}
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-2xl font-bold text-pitch" style={{ fontFamily: "var(--font-bebas)" }}>
                {statsA.name}
              </p>
              {statsA.position > 0 && (
                <p className="text-xs text-muted-foreground">#{statsA.position} i tabellen</p>
              )}
            </div>
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground font-bold text-xl">vs</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#3B82F6]" style={{ fontFamily: "var(--font-bebas)" }}>
                {statsB.name}
              </p>
              {statsB.position > 0 && (
                <p className="text-xs text-muted-foreground">#{statsB.position} i tabellen</p>
              )}
            </div>
          </div>

          {/* Nyckeltal */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Nyckeltal
            </h2>
            <StatRow label="Poäng" a={statsA.points} b={statsB.points} />
            <StatRow label="Spelade" a={statsA.played} b={statsB.played} higherIsBetter={false} />
            <StatRow label="Vinster" a={statsA.won} b={statsB.won} />
            <StatRow label="Oavgjorda" a={statsA.drawn} b={statsB.drawn} />
            <StatRow label="Förluster" a={statsA.lost} b={statsB.lost} higherIsBetter={false} />
            <StatRow label="Mål gjorda" a={statsA.goals_for} b={statsB.goals_for} />
            <StatRow label="Mål insläppta" a={statsA.goals_against} b={statsB.goals_against} higherIsBetter={false} />
            <StatRow label="Målskillnad" a={statsA.goal_diff} b={statsB.goal_diff} />
            <FormRow label="Form (5 sista)" a={statsA.form} b={statsB.form} />
          </div>

          {/* AI-analys */}
          {aiAnalysis ? (
            <div className="bg-card border border-pitch/30 rounded-xl p-4">
              <p className="text-xs text-pitch font-semibold uppercase tracking-wide mb-2">
                Vår AI-analys
              </p>
              <p className="text-sm text-foreground leading-relaxed">{aiAnalysis}</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                AI-analys
              </p>
              <p className="text-sm text-muted-foreground italic">
                AI-jämförelse genereras automatiskt när tillräcklig match-data finns tillgänglig.
              </p>
            </div>
          )}

          {/* Ingen data */}
          {statsA.played === 0 && statsB.played === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Ingen match-data i databasen än. Kör OS-17 (match-collector) för att samla statistik.
            </p>
          )}
        </div>
      )}

      {/* Lag hittades ej */}
      {slugA && slugB && (!statsA || !statsB) && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Kunde inte hitta statistik för ett eller båda lag.</p>
          <p className="text-xs mt-1">Kontrollera att lagen finns i Supabase entities-tabellen.</p>
        </div>
      )}
    </div>
  );
}
