import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchdayPhase } from "@/lib/matchday/matchdayPhase";
import type { FixtureRow } from "@/lib/team-hub/queries";

function fixture(partial: Partial<FixtureRow>): FixtureRow {
  return {
    sportmonks_id: 1,
    home_team_id: 10,
    away_team_id: 20,
    home_team_name: "Home FC",
    away_team_name: "Away FC",
    home_score: null,
    away_score: null,
    kickoff_at: null,
    status: "NS",
    ...partial,
  };
}

describe("matchdayPhase", () => {
  const now = new Date("2026-07-26T18:00:00Z");

  it("returns 'none' when there is no match", () => {
    assert.equal(matchdayPhase(null, now), "none");
  });

  it("returns 'pre' for a future kickoff with status NS", () => {
    const match = fixture({ status: "NS", kickoff_at: "2026-07-26T20:00:00Z" });
    assert.equal(matchdayPhase(match, now), "pre");
  });

  it("returns 'live' for status LIVE", () => {
    const match = fixture({ status: "LIVE", kickoff_at: "2026-07-26T17:00:00Z" });
    assert.equal(matchdayPhase(match, now), "live");
  });

  it("returns 'post' for status FT", () => {
    const match = fixture({ status: "FT", kickoff_at: "2026-07-26T15:00:00Z", home_score: 2, away_score: 1 });
    assert.equal(matchdayPhase(match, now), "post");
  });

  it("treats a past-kickoff NS match as live (sync lag)", () => {
    const match = fixture({ status: "NS", kickoff_at: "2026-07-26T17:00:00Z" });
    assert.equal(matchdayPhase(match, now), "live");
  });
});
