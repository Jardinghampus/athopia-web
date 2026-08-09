import assert from "node:assert/strict";
import test from "node:test";
import { displayStatus, isLiveNow, isLiveStatus } from "./live";

const NOW = new Date("2026-08-09T20:00:00Z").getTime();
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();

test("LIVE strax efter avspark visas som live", () => {
  assert.equal(isLiveNow("LIVE", hoursAgo(1), NOW), true);
  assert.equal(isLiveNow("inprogress", hoursAgo(2.5), NOW), true);
});

test("LIVE efter fönstret visas aldrig som live", () => {
  // Regressionen: två matcher stod LIVE i 127 timmar 2026-08-02.
  assert.equal(isLiveNow("LIVE", hoursAgo(127), NOW), false);
  assert.equal(isLiveNow("LIVE", hoursAgo(5), NOW), false);
});

test("saknad eller framtida avspark är inte live", () => {
  assert.equal(isLiveNow("LIVE", null, NOW), false);
  assert.equal(isLiveNow("LIVE", "inte ett datum", NOW), false);
  assert.equal(isLiveNow("LIVE", new Date(NOW + 3600_000).toISOString(), NOW), false);
});

test("icke-LIVE-status påverkas inte", () => {
  assert.equal(isLiveNow("FT", hoursAgo(1), NOW), false);
  assert.equal(isLiveStatus("NS"), false);
});

test("displayStatus hittar inte på resultat", () => {
  assert.equal(displayStatus("LIVE", hoursAgo(1), false, NOW), "LIVE");
  // Stale med resultat = spelad; utan resultat vägrar vi påstå något.
  assert.equal(displayStatus("LIVE", hoursAgo(127), true, NOW), "FT");
  assert.equal(displayStatus("LIVE", hoursAgo(127), false, NOW), "NS");
  assert.equal(displayStatus("FT", hoursAgo(127), true, NOW), "FT");
});
