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

  it("ranks live_match above upcoming_matches", () => {
    const ranked = rankFeedModules([
      mod({
        id: "up",
        type: "upcoming_matches",
        payload: {
          matches: [
            {
              fixtureId: 2,
              homeName: "A",
              awayName: "B",
              startingAt: new Date(Date.now() + 3_600_000).toISOString(),
            },
          ],
        },
      }),
      mod({
        id: "live",
        type: "live_match",
        payload: { fixtureId: 1, homeName: "A", awayName: "B" },
      }),
    ]);
    assert.equal(ranked[0]!.id, "live");
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

describe("rankFeedModules — Slice 2 personalization (FEED_RANKER_V2)", () => {
  const candidates: FeedModule[] = [
    mod({
      id: "headline_a",
      type: "headline_stack",
      payload: { newsTag: null },
    }),
    mod({
      id: "headline_b",
      type: "headline_stack",
      payload: { newsTag: null },
    }),
    mod({
      id: "discussion_followed",
      type: "discussion",
      payload: { teamSlug: "team-1" },
    }),
    mod({
      id: "discussion_other",
      type: "discussion",
      payload: { teamSlug: "team-2" },
    }),
  ];

  it("flag OFF ⇒ identical output to v1 for the same fixture set (ctx ignored)", () => {
    delete process.env.FEED_RANKER_V2;
    const withoutCtx = rankFeedModules(candidates, 10);
    const withCtxButFlagOff = rankFeedModules(candidates, 10, {
      followedTeamIds: ["team-1"],
    });
    assert.deepEqual(withCtxButFlagOff, withoutCtx);
  });

  it("flag ON ⇒ a followed-team module outranks an equal non-followed one, with explainable factors", () => {
    process.env.FEED_RANKER_V2 = "true";
    try {
      const ranked = rankFeedModules(candidates, 10, {
        followedTeamIds: ["team-1"],
      });
      const followedIdx = ranked.findIndex((m) => m.id === "discussion_followed");
      const otherIdx = ranked.findIndex((m) => m.id === "discussion_other");
      assert.ok(followedIdx < otherIdx);
      assert.ok(
        ranked[followedIdx]!.tracking.factors.some((f) =>
          f.startsWith("team_affinity="),
        ),
      );
      // Second headline_stack module should show the type-fatigue penalty factor.
      const headlineB = ranked.find((m) => m.id === "headline_b")!;
      assert.ok(
        headlineB.tracking.factors.some((f) => f.startsWith("type_fatigue=")),
      );
    } finally {
      delete process.env.FEED_RANKER_V2;
    }
  });
});
