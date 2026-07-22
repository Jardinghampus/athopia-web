import assert from "node:assert/strict";
import test from "node:test";
import {
  activeGoalEvents,
  applyMatchEventSnapshot,
  syntheticLiveEventId,
  type MatchEvent,
} from "./events";

function ev(partial: Partial<MatchEvent> & Pick<MatchEvent, "eventId">): MatchEvent {
  return {
    fixtureId: 1,
    sequence: 1,
    minute: 10,
    extraMinute: null,
    teamId: 1,
    playerId: 100,
    relatedPlayerId: null,
    playerName: "Test",
    eventType: "GOAL",
    result: "1-0",
    revision: 1,
    rescinded: false,
    isCorrected: false,
    ...partial,
  };
}

test("applyMatchEventSnapshot is idempotent by eventId", () => {
  const first = [ev({ eventId: 1, minute: 12, revision: 1 })];
  const second = [
    ev({ eventId: 1, minute: 13, revision: 2, result: "1-0" }),
    ev({ eventId: 2, minute: 45, sequence: 2 }),
  ];
  const once = applyMatchEventSnapshot([], first);
  const twice = applyMatchEventSnapshot(once, second);
  const thrice = applyMatchEventSnapshot(twice, second);
  assert.equal(twice.length, 2);
  assert.equal(twice.find((e) => e.eventId === 1)?.minute, 13);
  assert.deepEqual(
    thrice.map((e) => e.eventId),
    twice.map((e) => e.eventId)
  );
  assert.equal(thrice.find((e) => e.eventId === 1)?.revision, 2);
});

test("activeGoalEvents drops rescinded VAR corrections", () => {
  const events = [
    ev({ eventId: 1, eventType: "GOAL" }),
    ev({ eventId: 2, eventType: "GOAL", rescinded: true, isCorrected: true }),
    ev({ eventId: 3, eventType: "PENALTY_MISSED" }),
    ev({ eventId: 4, eventType: "OWN_GOAL" }),
  ];
  const active = activeGoalEvents(events);
  assert.deepEqual(
    active.map((e) => e.eventId),
    [1, 4]
  );
});

test("syntheticLiveEventId is stable for same inputs", () => {
  const a = syntheticLiveEventId({
    fixtureId: 99,
    minute: 22,
    typeId: 14,
    participantId: 5,
    playerName: "Berg",
  });
  const b = syntheticLiveEventId({
    fixtureId: 99,
    minute: 22,
    typeId: 14,
    participantId: 5,
    playerName: "Berg",
  });
  const c = syntheticLiveEventId({
    fixtureId: 99,
    minute: 23,
    typeId: 14,
    participantId: 5,
    playerName: "Berg",
  });
  assert.equal(a, b);
  assert.ok(a < 0);
  assert.notEqual(a, c);
});
