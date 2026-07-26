import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPersonalDaily,
  getItemBudget,
  type PersonalDailyItem,
  type PersonalDailyInputs,
} from "@/lib/daily/personal-daily";

function item(id: string, title = id): PersonalDailyItem {
  return {
    id,
    title,
    href: `/nyhet/${id}`,
    sourceName: "Källa",
    publishedAt: "2026-07-26T08:00:00.000Z",
  };
}

const EMPTY_INPUTS: PersonalDailyInputs = {
  followedTeamNews: [],
  todayMatch: null,
  leagueItems: [],
  topImportance: [],
};

describe("getItemBudget", () => {
  it("grows with minutes", () => {
    assert.equal(getItemBudget(3), 4);
    assert.equal(getItemBudget(5), 7);
    assert.equal(getItemBudget(7), 10);
    assert.ok(getItemBudget(3) < getItemBudget(5));
    assert.ok(getItemBudget(5) < getItemBudget(7));
  });

  it("falls back to the 5-minute budget for an unmapped value", () => {
    assert.equal(getItemBudget(11), getItemBudget(5));
  });
});

describe("buildPersonalDaily", () => {
  it("returns isEmpty=true and no sections when every input is empty", () => {
    const result = buildPersonalDaily(EMPTY_INPUTS, 5);
    assert.equal(result.isEmpty, true);
    assert.deepEqual(result.sections, []);
    assert.equal(result.minutes, 5);
  });

  it("omits a section entirely when it has no items (never fabricates)", () => {
    const result = buildPersonalDaily(
      { ...EMPTY_INPUTS, topImportance: [item("a")] },
      5,
    );
    assert.equal(result.sections.length, 1);
    assert.equal(result.sections[0]!.key, "vart-att-veta");
  });

  it("dedupes an item across sections — first section wins", () => {
    const shared = item("shared", "Delad nyhet");
    const result = buildPersonalDaily(
      {
        followedTeamNews: [shared],
        todayMatch: null,
        leagueItems: [],
        topImportance: [shared, item("other")],
      },
      5,
    );
    const teamSection = result.sections.find((s) => s.key === "mitt-lag");
    const topSection = result.sections.find((s) => s.key === "vart-att-veta");
    assert.ok(teamSection);
    assert.equal(teamSection!.items.some((i) => i.id === "shared"), true);
    assert.equal(topSection!.items.some((i) => i.id === "shared"), false);
    assert.equal(topSection!.items.some((i) => i.id === "other"), true);
  });

  it("caps each section at the minutes-derived item budget", () => {
    const many = Array.from({ length: 20 }, (_, i) => item(`n${i}`));
    const result3 = buildPersonalDaily({ ...EMPTY_INPUTS, topImportance: many }, 3);
    const result7 = buildPersonalDaily({ ...EMPTY_INPUTS, topImportance: many }, 7);
    assert.equal(result3.sections[0]!.items.length, getItemBudget(3));
    assert.equal(result7.sections[0]!.items.length, getItemBudget(7));
  });

  it("includes the match section only when a match is present, ordered after 'Ditt lag'", () => {
    const result = buildPersonalDaily(
      {
        followedTeamNews: [item("team-news")],
        todayMatch: item("match:1", "Lag A vs Lag B"),
        leagueItems: [],
        topImportance: [],
      },
      5,
    );
    assert.deepEqual(
      result.sections.map((s) => s.key),
      ["mitt-lag", "dagens-match"],
    );
  });
});
