import type { Metadata } from "next";
import Image from "next/image";
import { fetchStandingsFull } from "@/lib/sportsmonks";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { BarChart3 } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getTeamName(slug: string): Promise<string> {
  if (!isSupabaseConfigured()) return slug;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("name")
      .eq("slug", slug)
      .eq("type", "team")
      .maybeSingle();
    return data?.name ?? slug;
  } catch {
    return slug;
  }
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[\s\-._]/g, "");
}

const FORM_STYLES: Record<string, string> = {
  W: "bg-pitch text-white",
  D: "bg-muted text-foreground",
  L: "bg-red-500/20 text-red-400",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = await getTeamName(slug);
  return {
    title: `${name} — Statistik`,
    description: `Säsongsstatistik för ${name}: poäng, form, mål och tabellposition på Athopia.`,
  };
}

export default async function LagStatistikPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teamName = await getTeamName(slug);
  const standings = await fetchStandingsFull();
  const teamSlugNorm = normalize(slug);
  const teamNameNorm = normalize(teamName);

  const row = standings.find(
    (s) =>
      normalize(s.team.name).includes(teamSlugNorm) ||
      teamSlugNorm.includes(normalize(s.team.name).substring(0, 5)) ||
      normalize(s.team.name).includes(teamNameNorm.substring(0, 5))
  ) ?? null;

  const hasData = standings.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="font-heading text-3xl text-foreground mb-6">
        STATISTIK — {teamName.toUpperCase()}
      </h2>

      {!hasData && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <BarChart3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">Statistik kräver SPORTSMONKS_API_TOKEN.</p>
        </div>
      )}

      {hasData && !row && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <BarChart3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">Hittade inte {teamName} i tabellen.</p>
        </div>
      )}

      {row && (
        <div className="space-y-6">
          {/* Team card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
            {row.team.image_path && (
              <div className="relative w-16 h-16 shrink-0">
                <Image src={row.team.image_path} alt={row.team.name} fill className="object-contain" sizes="64px" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tabellposition</p>
              <p className="font-heading text-6xl text-pitch leading-none">#{row.position}</p>
              <p className="text-sm text-muted-foreground mt-1">{row.points} poäng</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Matcher", value: row.played },
              { label: "Vinster", value: row.wins },
              { label: "Oavgjorda", value: row.draws },
              { label: "Förluster", value: row.losses },
              { label: "Gjorda mål", value: row.goals_for },
              { label: "Insläppta", value: row.goals_against },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="font-heading text-3xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Målskillnad */}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Målskillnad</span>
            <span className={`font-heading text-2xl ${row.goal_diff >= 0 ? "text-pitch" : "text-red-400"}`}>
              {row.goal_diff >= 0 ? "+" : ""}{row.goal_diff}
            </span>
          </div>

          {/* Form */}
          {row.form.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Senaste form</p>
              <div className="flex gap-2">
                {row.form.map((r, i) => (
                  <span
                    key={i}
                    className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center ${FORM_STYLES[r] ?? "bg-muted"}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full standings preview */}
      {hasData && standings.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading text-xl text-foreground mb-3">ALLSVENSKAN-TABELL</h3>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium w-8">#</th>
                  <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Lag</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium">S</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium">V</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium hidden sm:table-cell">O</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium hidden sm:table-cell">F</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium hidden md:table-cell">+/-</th>
                  <th className="text-center px-3 py-2.5 text-xs text-muted-foreground font-medium font-bold">P</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => {
                  const isCurrentTeam = s.team.id === row?.team.id;
                  return (
                    <tr
                      key={s.team.id}
                      className={`border-b border-border/50 last:border-0 transition-colors ${
                        isCurrentTeam ? "bg-pitch/8 dark:bg-pitch/10" : i % 2 === 1 ? "bg-muted/20" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">{s.position}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {s.team.image_path && (
                            <div className="relative w-5 h-5 shrink-0">
                              <Image src={s.team.image_path} alt={s.team.name} fill className="object-contain" sizes="20px" />
                            </div>
                          )}
                          <span className={`font-medium ${isCurrentTeam ? "text-pitch" : "text-foreground"}`}>
                            {s.team.short_code ?? s.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-2.5 text-muted-foreground">{s.played}</td>
                      <td className="text-center px-3 py-2.5 text-muted-foreground">{s.wins}</td>
                      <td className="text-center px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{s.draws}</td>
                      <td className="text-center px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{s.losses}</td>
                      <td className={`text-center px-3 py-2.5 hidden md:table-cell ${s.goal_diff >= 0 ? "text-pitch" : "text-red-400"}`}>
                        {s.goal_diff >= 0 ? "+" : ""}{s.goal_diff}
                      </td>
                      <td className="text-center px-3 py-2.5 font-bold text-foreground">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
