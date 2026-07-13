/**
 * lib/team-names.ts — robust sportmonks_id → lagnamn.
 *
 * Flera ställen slog upp lagnamn mot bara EN källa (antingen `teams` eller
 * bara `entities`) och föll tillbaka på det råa numeriska sportmonks_id:t
 * i UI:t ("Lag 620", eller rå siffra i AI-tabellsvar) när den källan
 * saknade raden — vanligt eftersom `teams` fylls av en sync-job som inte
 * alltid hunnit köra för alla lag. `entities` (type='team') är den
 * kanoniska listan av de 16 Allsvenskan-klubbarna och saknar nästan
 * aldrig en rad, så den slås upp först; `teams` fyller i logotyp.
 */
import { createServerClient } from "@/lib/supabase";

export interface TeamNameEntry {
  name: string;
  logo: string | null;
}

export async function getTeamNameMap(
  db: ReturnType<typeof createServerClient>,
  sportmonksIds?: number[]
): Promise<Map<number, TeamNameEntry>> {
  const entBuilder = db.from("entities").select("sportmonks_id,name,metadata").eq("type", "team");
  const teamsBuilder = db.from("teams").select("sportmonks_id,name,logo");

  const [{ data: ents }, { data: teams }] = await Promise.all([
    sportmonksIds?.length ? entBuilder.in("sportmonks_id", sportmonksIds) : entBuilder,
    sportmonksIds?.length ? teamsBuilder.in("sportmonks_id", sportmonksIds) : teamsBuilder,
  ]);

  const map = new Map<number, TeamNameEntry>();

  // entities = kanonisk källa, slås upp först.
  for (const e of ents ?? []) {
    if (e.sportmonks_id == null) continue;
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    map.set(Number(e.sportmonks_id), {
      name: String(e.name ?? ""),
      logo: (meta.logo_url as string | null) ?? null,
    });
  }

  // teams fyller i logga (och namn om entities saknade raden).
  for (const t of teams ?? []) {
    if (t.sportmonks_id == null) continue;
    const id = Number(t.sportmonks_id);
    const existing = map.get(id);
    map.set(id, {
      name: existing?.name || String(t.name ?? ""),
      logo: existing?.logo ?? (t.logo as string | null) ?? null,
    });
  }

  return map;
}
