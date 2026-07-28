import { test } from "node:test";
import assert from "node:assert/strict";
import { buildKeyMoments } from "./keyMoments";
import type { MatchEvent } from "./events";

function ev(p: Partial<MatchEvent>): MatchEvent {
  return {
    eventId: 1, fixtureId: 1, sequence: 1, minute: null, extraMinute: null,
    teamId: null, playerId: null, relatedPlayerId: null, playerName: null,
    eventType: "", result: null, revision: 1, rescinded: false, isCorrected: false,
    ...p,
  };
}

test("goals rank above cards, then chronological", () => {
  const out = buildKeyMoments([
    ev({ eventId: 1, minute: 80, eventType: "REDCARD", playerName: "Kalle" }),
    ev({ eventId: 2, minute: 10, eventType: "GOAL", playerName: "Anna" }),
    ev({ eventId: 3, minute: 60, eventType: "GOAL", playerName: "Bo" }),
  ]);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((m) => m.kind), ["goal", "goal", "red_card"]);
  assert.match(out[0].text, /Mål — Anna/); // minute 10 before 60
});

test("VAR-rescinded goals never count", () => {
  const out = buildKeyMoments([
    ev({ eventType: "GOAL", playerName: "X", rescinded: true }),
  ]);
  assert.equal(out.length, 0);
});

test("caps at limit", () => {
  const many = [1, 2, 3, 4, 5].map((i) => ev({ eventId: i, minute: i, eventType: "GOAL", playerName: `P${i}` }));
  assert.equal(buildKeyMoments(many).length, 3);
});

test("missing player name never breaks output", () => {
  const out = buildKeyMoments([ev({ eventType: "GOAL" })]);
  assert.match(out[0].text, /okänd spelare/);
});

test("no decisive events returns empty (never fabricate)", () => {
  const out = buildKeyMoments([ev({ eventType: "SUBSTITUTION", playerName: "Y" })]);
  assert.deepEqual(out, []);
});
