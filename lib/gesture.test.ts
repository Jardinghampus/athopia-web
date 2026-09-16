import { test } from "node:test";
import assert from "node:assert/strict";
import { project, rubberband } from "./gesture";

test("rubberband följer nästan 1:1 nära noll", () => {
  // 10 px in i en 800 px-yta ska kännas som ett direkt drag, inte som sirap.
  assert.ok(rubberband(10, 800) > 5, "för styvt vid små drag");
  assert.ok(rubberband(10, 800) <= 10, "får aldrig överstiga fingret");
});

test("rubberband styvnar progressivt och når aldrig dimensionen", () => {
  const prev = [1, 50, 200, 1000, 100_000].map((d) => rubberband(d, 120));
  for (let i = 1; i < prev.length; i++) {
    assert.ok(prev[i] > prev[i - 1], "ska vara monoton");
    assert.ok(prev[i] < 120, "ska vara asymptotisk mot dimensionen");
  }
  // Avkastningen avtar: samma extra drag ger mindre och mindre rörelse.
  assert.ok(rubberband(100, 120) - rubberband(50, 120) > rubberband(200, 120) - rubberband(150, 120));
});

test("rubberband nollar negativa och nolldrag", () => {
  assert.equal(rubberband(0, 120), 0);
  assert.equal(rubberband(-40, 120), 0);
});

test("pull-to-refresh behåller känslan vid tröskeln", () => {
  // 144 px drag gav förut linjärt 72 px = exakt PULL_THRESHOLD. Den punkten
  // ska inte flytta sig, annars ändras muskelminnet för hela gesten.
  assert.ok(Math.abs(rubberband(144, 800) - 72) < 1);
});

test("project ignorerar drift men räknar snärt", () => {
  assert.ok(project(200) < 25, "en långsam drift ska inte committa");
  assert.ok(project(1200) > 100, "en snärt ska bära långt");
  assert.ok(project(-500) < 0, "bakåtrörelse projicerar bakåt");
  assert.equal(project(0), 0);
});

test("kantsvepets commit-beslut", () => {
  const COMMIT = 64;
  const commits = (dx: number, v: number) => dx + project(v) >= COMMIT;
  assert.equal(commits(30, 0), false, "kort, stilla drag backar inte");
  assert.equal(commits(30, 1200), true, "kort drag + snärt backar");
  assert.equal(commits(100, 0), true, "långt drag backar utan hastighet");
  assert.equal(commits(20, 200), false, "20 px drift får aldrig navigera bort");
  assert.equal(commits(10, -500), false, "rörelse åt fel håll backar aldrig");
});

test("scrollens decelerationRate är för stark för en 64 px-tröskel", () => {
  // Regressionsvakt: någon som "rättar" tillbaka till 0.998 bryter gesten.
  assert.ok(project(200, 0.998) > 64, "0.998 committar på ren drift");
  assert.ok(project(200) < 64, "0.99 gör det inte");
});
