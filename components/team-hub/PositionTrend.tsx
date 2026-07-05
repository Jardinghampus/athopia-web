/**
 * PositionTrend — lagets tabellplacering omgång för omgång.
 * Server component. Läser standings_snapshots (backfyllda per omgång 2026-07-06).
 * Ren SVG, ingen chart-lib. Y-axeln inverterad: plats 1 = högst upp.
 * En Bolldata-liknande "utvecklingskurva" men bara för det egna laget.
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getTeamColors } from "@/lib/team-colors";

interface Point {
  date: string;
  position: number;
}

async function getHistory(teamSlug: string): Promise<{ points: Point[]; teamCount: number } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerClient();
    const { data: entity } = await db
      .from("entities")
      .select("sportmonks_id")
      .eq("type", "team")
      .eq("slug", teamSlug)
      .maybeSingle();
    const smId = entity?.sportmonks_id;
    if (smId == null) return null;

    const { data: season } = await db
      .from("seasons").select("sportmonks_id").eq("sport", "football").eq("is_current", true).maybeSingle();
    if (!season?.sportmonks_id) return null;

    const { data } = await db
      .from("standings_snapshots")
      .select("snapshot_date, position, team_id")
      .eq("season_id", season.sportmonks_id)
      .order("snapshot_date", { ascending: true });
    if (!data?.length) return null;

    const dates = [...new Set(data.map((r) => String(r.snapshot_date)))];
    const teamCount = new Set(data.map((r) => Number(r.team_id))).size || 16;
    const points: Point[] = [];
    for (const r of data) {
      if (Number(r.team_id) === Number(smId)) {
        points.push({ date: String(r.snapshot_date), position: Number(r.position) });
      }
    }
    if (points.length < 2) return null;
    return { points, teamCount };
  } catch {
    return null;
  }
}

export async function PositionTrend({ teamSlug }: { teamSlug: string }) {
  const hist = await getHistory(teamSlug);
  if (!hist) return null;

  const { points, teamCount } = hist;
  const W = 640;
  const H = 120;
  const padX = 8;
  const padY = 14;
  const accent = getTeamColors(teamSlug).primary;
  const usable = points.length > 1 ? points.length - 1 : 1;

  // position 1 → topp (y = padY), position teamCount → botten
  const xy = points.map((p, i) => {
    const x = padX + (i / usable) * (W - 2 * padX);
    const y = padY + ((p.position - 1) / (teamCount - 1)) * (H - 2 * padY);
    return { x, y, position: p.position };
  });
  const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const first = points[0].position;
  const last = points[points.length - 1].position;
  const delta = first - last; // positiv = klättrat

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 mt-6" aria-label="Placeringsutveckling">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Placering över tid</h2>
          <span className={`text-xs font-semibold ${delta > 0 ? "text-pitch" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
            {delta > 0 ? `▲ ${delta} sedan start` : delta < 0 ? `▼ ${Math.abs(delta)} sedan start` : "Oförändrad"}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Placering från ${first} till ${last}`}>
          <path d={path} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {xy.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === xy.length - 1 ? 5 : 3} fill={accent} />
          ))}
          <text x={xy[0].x} y={xy[0].y - 8} className="fill-muted-foreground" fontSize="13" textAnchor="start">{first}:a</text>
          <text x={xy[xy.length - 1].x} y={xy[xy.length - 1].y - 8} className="fill-foreground" fontSize="13" fontWeight="700" textAnchor="end">{last}:a</text>
        </svg>
      </div>
    </section>
  );
}
