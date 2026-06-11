import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 60;

const SEASON_2026 = 26806;

async function getTeamSmId(slug: string): Promise<{ name: string; smId: number | null }> {
  if (!isSupabaseConfigured()) return { name: slug, smId: null };
  const db = createServerClient();
  const { data } = await db.from("entities").select("name,metadata").eq("type", "team").eq("slug", slug).maybeSingle();
  const meta = (data?.metadata ?? {}) as Record<string, unknown>;
  return { name: (data?.name as string) ?? slug, smId: (meta.sportsmonks_id as number | null) ?? null };
}

async function getTeamStandings(smId: number) {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db.from("team_season_stats").select("*").eq("team_id", smId).eq("season_id", SEASON_2026).maybeSingle();
  return data as Record<string, unknown> | null;
}

async function getPlayerStats(smId: number) {
  if (!isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("player_season_stats")
    .select("goals,assists,appearances,minutes,yellow_cards,red_cards,shots,xg,rating,players(sportmonks_id,fullname,position,image,slug)")
    .eq("team_id", smId)
    .eq("season_id", SEASON_2026)
    .order("goals", { ascending: false });
  return (data ?? []) as Record<string, unknown>[];
}

async function getTeamFixtures(smId: number) {
  if (!isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("fixtures")
    .select("sportmonks_id,home_team_name,away_team_name,home_score,away_score,kickoff_at,status,home_team_id,away_team_id")
    .eq("season_id", SEASON_2026)
    .eq("status", "FT")
    .or(`home_team_id.eq.${smId},away_team_id.eq.${smId}`)
    .order("kickoff_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Record<string, unknown>[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { name } = await getTeamSmId(slug);
  return { title: `${name} — Statistik | Athopia` };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="font-heading text-3xl text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default async function LagStatistikPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { name: teamName, smId } = await getTeamSmId(slug);

  const [standings, players, fixtures] = await Promise.all([
    smId ? getTeamStandings(smId) : Promise.resolve(null),
    smId ? getPlayerStats(smId) : Promise.resolve([]),
    smId ? getTeamFixtures(smId) : Promise.resolve([]),
  ]);

  const byGoals   = [...players].sort((a, b) => (b.goals as number) - (a.goals as number)).slice(0, 5);
  const byAssists = [...players].sort((a, b) => (b.assists as number) - (a.assists as number)).slice(0, 5);
  const byApps    = [...players].sort((a, b) => (b.appearances as number) - (a.appearances as number)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h2 className="font-heading text-3xl text-foreground">STATISTIK — {teamName.toUpperCase()}</h2>

      {/* Tabellrad */}
      {standings && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Spelade" value={standings.played as number ?? 0} />
            <StatCard label="Vinster"  value={standings.wins as number ?? 0} />
            <StatCard label="Oavgjorda" value={standings.draws as number ?? 0} />
            <StatCard label="Förluster" value={standings.losses as number ?? 0} />
            <StatCard label="Gjorda mål" value={standings.goals_for as number ?? 0} />
            <StatCard label="Insläppta" value={standings.goals_against as number ?? 0} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl border border-border bg-card p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Poäng</span>
              <span className="font-heading text-2xl text-[#1D9E75]">{standings.points as number ?? 0}</span>
            </div>
            <div className="flex-1 rounded-xl border border-border bg-card p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Målskillnad</span>
              <span className={`font-heading text-2xl ${(standings.goal_diff as number ?? 0) >= 0 ? "text-[#1D9E75]" : "text-red-400"}`}>
                {(standings.goal_diff as number ?? 0) >= 0 ? "+" : ""}{standings.goal_diff as number ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interna ligorna */}
      {players.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "SKYTTELIGA", rows: byGoals, key: "goals", label: "Mål" },
            { title: "ASSISTLIGA", rows: byAssists, key: "assists", label: "Ast" },
            { title: "SPELAD TID", rows: byApps, key: "appearances", label: "Mch" },
          ].map(({ title, rows, key, label }) => (
            <div key={title} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-heading text-sm text-foreground">{title}</h3>
              </div>
              <div className="divide-y divide-border/50">
                {rows.map((row, i) => {
                  const pl = row.players as Record<string, unknown> | null;
                  const playerSlug = (pl?.slug as string) ?? String(pl?.sportmonks_id ?? "");
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      {!!pl?.image && (
                        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0">
                          <Image src={pl.image as string} alt="" fill className="object-cover" sizes="28px" />
                        </div>
                      )}
                      <Link href={`/spelare/${playerSlug}`} className="flex-1 text-sm text-foreground hover:text-[#1D9E75] truncate">
                        {(pl?.fullname as string) ?? "–"}
                      </Link>
                      <span className="text-sm font-bold text-foreground">{String(row[key] ?? 0)}</span>
                      <span className="text-xs text-muted-foreground w-6">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full spelarstatistik-tabell */}
      {players.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-heading text-sm text-foreground">ALL SPELARTSTATISTIK</h3>
          </div>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground">Spelare</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">Pos</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">M</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">Mål</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">Ast</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">xG</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">Skott</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">🟨</th>
                <th className="text-center px-3 py-2 text-xs text-muted-foreground">🟥</th>
              </tr>
            </thead>
            <tbody>
              {players.map((row, i) => {
                const pl = row.players as Record<string, unknown> | null;
                const playerSlug = (pl?.slug as string) ?? String(pl?.sportmonks_id ?? "");
                return (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2">
                      <Link href={`/spelare/${playerSlug}`} className="text-foreground hover:text-[#1D9E75]">
                        {(pl?.fullname as string) ?? "–"}
                      </Link>
                    </td>
                    <td className="text-center px-3 py-2 text-muted-foreground capitalize">{(pl?.position as string)?.slice(0, 3) ?? "–"}</td>
                    <td className="text-center px-3 py-2 text-muted-foreground">{row.appearances as number ?? 0}</td>
                    <td className="text-center px-3 py-2 font-semibold text-foreground">{row.goals as number ?? 0}</td>
                    <td className="text-center px-3 py-2 text-foreground">{row.assists as number ?? 0}</td>
                    <td className="text-center px-3 py-2 text-muted-foreground">{row.xg ? Number(row.xg).toFixed(1) : "–"}</td>
                    <td className="text-center px-3 py-2 text-muted-foreground">{row.shots as number ?? 0}</td>
                    <td className="text-center px-3 py-2 text-yellow-500">{row.yellow_cards as number ?? 0}</td>
                    <td className="text-center px-3 py-2 text-red-500">{row.red_cards as number ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Senaste matcher */}
      {fixtures.length > 0 && (
        <div>
          <h3 className="font-heading text-xl text-foreground mb-3">SENASTE MATCHER</h3>
          <div className="space-y-2">
            {fixtures.map((f) => {
              const isHome = String(f.home_team_id) === String(smId);
              const opp  = isHome ? f.away_team_name : f.home_team_name;
              const hs   = f.home_score as number;
              const as_  = f.away_score as number;
              const won  = isHome ? hs > as_ : as_ > hs;
              const drew = hs === as_;
              const result = drew ? "O" : won ? "V" : "F";
              const color  = drew ? "text-muted-foreground" : won ? "text-[#1D9E75]" : "text-red-400";
              return (
                <Link key={f.sportmonks_id as number} href={`/match/${f.sportmonks_id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-[#1D9E75]/50 transition-colors">
                  <span className={`font-bold text-sm w-5 ${color}`}>{result}</span>
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {isHome ? "H" : "B"} · {opp as string}
                  </span>
                  <span className="font-heading text-lg text-foreground">{hs}–{as_}</span>
                  <span className="text-xs text-muted-foreground">
                    {f.kickoff_at ? new Date(f.kickoff_at as string).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!standings && players.length === 0 && (
        <p className="text-sm text-muted-foreground">Ingen statistik tillgänglig ännu.</p>
      )}
    </div>
  );
}
