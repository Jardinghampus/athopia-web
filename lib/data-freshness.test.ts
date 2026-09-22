import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCoveredThrough,
  freshnessOf,
  stalenessNotice,
} from "./data-freshness";

const NOW = new Date("2026-09-22T12:00:00Z");

test("färsk data nära senaste omgång flaggas inte", () => {
  const f = freshnessOf("2026-09-21T15:00:00Z", 3, NOW);
  assert.equal(f.stale, false);
  assert.equal(f.ageDays, 0);
  assert.equal(stalenessNotice(f), null);
});

test("det verkliga fallet: tabellen täcker 2 augusti men visas 22 september", () => {
  const f = freshnessOf("2026-08-02T12:00:00Z", 3, NOW);
  assert.equal(f.stale, true);
  assert.equal(f.ageDays, 51);
  assert.match(stalenessNotice(f)!, /till och med 2 augusti/);
});

test("okänt datum räknas som opålitligt, aldrig som färskt", () => {
  const f = freshnessOf(null, 3, NOW);
  assert.equal(f.stale, true);
  assert.equal(f.ageDays, null);
  assert.match(stalenessNotice(f)!, /kan inte bekräfta/);
});

test("skräpdatum kraschar inte utan behandlas som okänt", () => {
  const f = freshnessOf("inte ett datum", 3, NOW);
  assert.equal(f.stale, true);
  assert.equal(f.coveredThrough, null);
});

test("gränsen går vid tröskeln, inte efter", () => {
  assert.equal(freshnessOf("2026-09-19T12:00:00Z", 3, NOW).stale, true);
  assert.equal(freshnessOf("2026-09-20T12:00:00Z", 3, NOW).stale, false);
});

test("datumet formateras i svensk tid, inte serverns UTC", () => {
  // 23:30 UTC är redan nästa dag i Stockholm under sommartid.
  assert.equal(formatCoveredThrough("2026-08-02T23:30:00Z"), "3 augusti");
});
