import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankFeedModules } from "@/lib/feed/rank-feed-modules";
import type { FeedModule } from "@/lib/feed/build-feed-modules";

function mod(
  partial: Partial<FeedModule> & Pick<FeedModule, "id" | "type">,
): FeedModule {
  return {
    schemaVersion: 1,
    tracking: { reason: "test", position: 99 },
    payload: {},
    ...partial,
  };
}

describe("rankFeedModules", () => {
  it("orders by explainable score and assigns slot positions", () => {
    const ranked = rankFeedModules([
      mod({
        id: "standings",
        type: "standings_snapshot",
        tracking: { reason: "league_pulse", position: 12 },
      }),
      mod({
        id: "pod",
        type: "podcast",
        tracking: { reason: "latest_podcast", position: 4 },
        payload: { publishedAt: new Date().toISOString() },
      }),
      mod({
        id: "hot",
        type: "discussion",
        tracking: { reason: "hot_thread", position: 8 },
        payload: {
          createdAt: new Date().toISOString(),
          likeCount: 20,
          replyCount: 10,
        },
      }),
    ]);

    assert.equal(ranked.length, 3);
    assert.ok(ranked[0]!.tracking.score >= ranked[1]!.tracking.score);
    assert.equal(ranked[0]!.tracking.position, 2);
    assert.equal(ranked[1]!.tracking.position, 4);
    assert.equal(ranked[2]!.tracking.position, 8);
    assert.ok(ranked[0]!.tracking.factors.length > 0);
  });

  it("ranks live_match above standings", () => {
    const ranked = rankFeedModules([
      mod({
        id: "standings",
        type: "standings_snapshot",
        tracking: { reason: "league_pulse", position: 12 },
      }),
      mod({
        id: "live",
        type: "live_match",
        tracking: { reason: "live_match", position: 2 },
        payload: { fixtureId: 1, homeName: "A", awayName: "B" },
      }),
    ]);
    assert.equal(ranked[0]!.id, "live");
    assert.equal(ranked[0]!.tracking.position, 2);
  });

  it("ranks architecture order: headline_stack above standings, short_post above podcast", () => {
    const ranked = rankFeedModules([
      mod({ id: "standings", type: "standings_snapshot" }),
      mod({ id: "headlines", type: "headline_stack" }),
      mod({
        id: "pod",
        type: "podcast",
        payload: { publishedAt: "2020-01-01T00:00:00Z" },
      }),
      mod({
        id: "short",
        type: "short_post",
        payload: { publishedAt: new Date().toISOString() },
      }),
      mod({
        id: "daily",
        type: "audio_briefing",
        payload: { episodeDate: new Date().toISOString() },
      }),
    ]);
    assert.equal(ranked[0]!.id, "daily");
    assert.ok(ranked.findIndex((m) => m.id === "short") < ranked.findIndex((m) => m.id === "pod"));
    assert.ok(
      ranked.findIndex((m) => m.id === "headlines") <
        ranked.findIndex((m) => m.id === "standings"),
    );
  });

  it("dedupes by id and caps limit", () => {
    const ranked = rankFeedModules(
      [
        mod({ id: "a", type: "podcast" }),
        mod({ id: "a", type: "podcast" }),
        mod({ id: "b", type: "discussion" }),
      ],
      1,
    );
    assert.equal(ranked.length, 1);
  });
});
