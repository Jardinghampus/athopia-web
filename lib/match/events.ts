/**
 * Match event snapshot + idempotent client apply (B-08).
 * Stable identity = Sportmonks event id. Rescinded (VAR) events stay in the
 * stream but must not count as active goals.
 */
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchEvent {
  eventId: number;
  fixtureId: number;
  sequence: number;
  minute: number | null;
  extraMinute: number | null;
  teamId: number | null;
  playerId: number | null;
  relatedPlayerId: number | null;
  playerName: string | null;
  eventType: string;
  result: string | null;
  revision: number;
  rescinded: boolean;
  isCorrected: boolean;
}

export interface MatchLineupRow {
  playerId: number;
  teamId: number | null;
  starter: boolean;
  jersey: number | null;
  position: string | null;
  playerName: string | null;
  image: string | null;
  slug: string | null;
}

export interface MatchTimelineSnapshot {
  fixtureId: number;
  snapshotRevision: string;
  events: MatchEvent[];
  lineups: MatchLineupRow[];
}

const LIVE_TYPE: Record<number, string> = {
  14: "GOAL",
  15: "OWN_GOAL",
  16: "PENALTY",
  17: "PENALTY_MISSED",
  18: "SUBSTITUTION",
  19: "YELLOWCARD",
  20: "REDCARD",
  21: "YELLOW_RED_CARD",
  10: "VAR",
};

function isRescinded(extra: unknown): boolean {
  if (!extra || typeof extra !== "object") return false;
  return (extra as Record<string, unknown>).rescinded === true;
}

/** Synthetic negative id when live_scores rows lack Sportmonks event id. */
export function syntheticLiveEventId(parts: {
  fixtureId: number;
  minute: unknown;
  typeId: unknown;
  participantId: unknown;
  playerName: unknown;
}): number {
  const key = [
    parts.fixtureId,
    parts.minute ?? "",
    parts.typeId ?? "",
    parts.participantId ?? "",
    parts.playerName ?? "",
  ].join("|");
  const digest = createHash("sha1").update(key).digest();
  // Negative int32-ish so it never collides with real sportmonks ids.
  return -((digest.readUInt32BE(0) % 2_000_000_000) + 1);
}

/**
 * Full-snapshot apply: last write wins per eventId. Safe for poll loops.
 */
export function applyMatchEventSnapshot(
  _prev: MatchEvent[],
  snapshot: MatchEvent[]
): MatchEvent[] {
  const byId = new Map<number, MatchEvent>();
  for (const ev of snapshot) {
    byId.set(ev.eventId, ev);
  }
  return [...byId.values()].sort((a, b) => {
    const ma = a.minute ?? 0;
    const mb = b.minute ?? 0;
    if (ma !== mb) return ma - mb;
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.eventId - b.eventId;
  });
}

/** Goals that still count after VAR. */
export function activeGoalEvents(events: MatchEvent[]): MatchEvent[] {
  return events.filter(
    (e) =>
      !e.rescinded &&
      !e.isCorrected &&
      /goal|penalty/i.test(e.eventType) &&
      !/missed/i.test(e.eventType)
  );
}

export async function buildMatchTimeline(
  db: SupabaseClient,
  fixtureId: number
): Promise<MatchTimelineSnapshot> {
  const [{ data: rows }, { data: live }, { data: lups }] = await Promise.all([
    db
      .from("fixture_events")
      .select(
        "sportmonks_id,fixture_id,minute,extra_minute,team_id,player_id,related_player_id,event_type,result,extra"
      )
      .eq("fixture_id", fixtureId)
      .order("minute", { ascending: true, nullsFirst: false }),
    db.from("live_scores").select("events").eq("fixture_id", fixtureId).maybeSingle(),
    db
      .from("fixture_lineups")
      .select("player_id,team_id,starter,jersey,position")
      .eq("fixture_id", fixtureId)
      .order("starter", { ascending: false }),
  ]);

  let rawEvents = (rows ?? []) as Array<Record<string, unknown>>;

  // Live: fixture_events often empty until FT — fall back to live_scores.events.
  if (rawEvents.length === 0 && Array.isArray(live?.events)) {
    rawEvents = (live!.events as Record<string, unknown>[]).map((e) => {
      const typeId = Number(e.type_id ?? 0);
      const eventId =
        typeof e.id === "number"
          ? e.id
          : syntheticLiveEventId({
              fixtureId,
              minute: e.minute,
              typeId: e.type_id,
              participantId: e.participant_id,
              playerName: e.player_name,
            });
      return {
        sportmonks_id: eventId,
        fixture_id: fixtureId,
        minute: e.minute ?? null,
        extra_minute: e.extra_minute ?? null,
        team_id: e.participant_id ?? null,
        player_id: e.player_id ?? null,
        related_player_id: e.related_player_id ?? null,
        event_type: LIVE_TYPE[typeId] ?? String(e.type_id ?? ""),
        result: e.result ?? null,
        extra: e.rescinded === true ? { rescinded: true } : null,
        live_player_name: (e.player_name as string | null) ?? null,
      };
    });
  }

  const playerIds = Array.from(
    new Set(
      [
        ...rawEvents.flatMap((e) => [e.player_id, e.related_player_id]),
        ...(lups ?? []).map((l: Record<string, unknown>) => l.player_id),
      ]
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  );

  const playerMap: Record<
    number,
    { fullname: string; image: string | null; slug: string | null }
  > = {};
  if (playerIds.length > 0) {
    const { data: players } = await db
      .from("players")
      .select("sportmonks_id,fullname,image,slug")
      .in("sportmonks_id", playerIds);
    for (const p of players ?? []) {
      const id = Number((p as Record<string, unknown>).sportmonks_id);
      playerMap[id] = {
        fullname: String((p as Record<string, unknown>).fullname ?? `Spelare ${id}`),
        image: ((p as Record<string, unknown>).image as string | null) ?? null,
        slug: ((p as Record<string, unknown>).slug as string | null) ?? null,
      };
    }
  }

  const sorted = [...rawEvents].sort(
    (a, b) => Number(a.minute ?? 0) - Number(b.minute ?? 0)
  );

  const events: MatchEvent[] = sorted.map((e, i) => {
    const eventId = Number(e.sportmonks_id);
    const rescinded = isRescinded(e.extra);
    const playerId = e.player_id != null ? Number(e.player_id) : null;
    const liveName =
      typeof e.live_player_name === "string" ? e.live_player_name : null;
    const playerName =
      (playerId != null ? playerMap[playerId]?.fullname : null) ?? liveName;
    // revision bumps when minute/type/result/rescinded change — clients replace by eventId.
    const revisionPayload = `${e.minute}|${e.event_type}|${e.result}|${rescinded}`;
    const revision =
      createHash("sha1").update(revisionPayload).digest().readUInt16BE(0) + 1;

    return {
      eventId,
      fixtureId,
      sequence: i + 1,
      minute: e.minute != null ? Number(e.minute) : null,
      extraMinute: e.extra_minute != null ? Number(e.extra_minute) : null,
      teamId: e.team_id != null ? Number(e.team_id) : null,
      playerId,
      relatedPlayerId:
        e.related_player_id != null ? Number(e.related_player_id) : null,
      playerName,
      eventType: String(e.event_type ?? ""),
      result: e.result != null ? String(e.result) : null,
      revision,
      rescinded,
      isCorrected: rescinded,
    };
  });

  // Idempotent dedupe by eventId (last wins).
  const deduped = applyMatchEventSnapshot([], events);

  const lineups: MatchLineupRow[] = ((lups ?? []) as Record<string, unknown>[]).map(
    (l) => {
      const playerId = Number(l.player_id);
      const p = playerMap[playerId];
      return {
        playerId,
        teamId: l.team_id != null ? Number(l.team_id) : null,
        starter: Boolean(l.starter),
        jersey: l.jersey != null ? Number(l.jersey) : null,
        position: l.position != null ? String(l.position) : null,
        playerName: p?.fullname ?? null,
        image: p?.image ?? null,
        slug: p?.slug ?? null,
      };
    }
  );

  const snapshotRevision = createHash("sha1")
    .update(
      JSON.stringify({
        events: deduped.map((e) => [e.eventId, e.revision]),
        lineups: lineups.map((l) => [l.playerId, l.starter, l.jersey]),
      })
    )
    .digest("hex")
    .slice(0, 16);

  return {
    fixtureId,
    snapshotRevision,
    events: deduped,
    lineups,
  };
}
