import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FeedConfigResponseSchema } from "@/lib/api-schemas";
import { FeedConfigPatchSchema } from "@/lib/feed/feed-config-schema";

const TEAM_ID = "4d3e7e58-5f23-4b6e-9f5d-c3ecb4ec1f95";

describe("FeedConfigPatchSchema", () => {
  it("accepts bounded football preferences", () => {
    const result = FeedConfigPatchSchema.safeParse({
      sport: "football",
      followed_team_ids: [TEAM_ID],
      followed_leagues: ["allsvenskan"],
      content_types: ["transfer", "match"],
      personalization_enabled: true,
    });

    assert.equal(result.success, true);
  });

  it("rejects non-football and unknown preference fields", () => {
    assert.equal(FeedConfigPatchSchema.safeParse({ sport: "golf" }).success, false);
    assert.equal(FeedConfigPatchSchema.safeParse({ premium_only: true }).success, false);
  });

  it("rejects malformed and oversized preference lists", () => {
    assert.equal(
      FeedConfigPatchSchema.safeParse({ followed_team_ids: [""] }).success,
      false,
    );
    assert.equal(
      FeedConfigPatchSchema.safeParse({
        content_types: ["transfer", "analysis", "match", "statistics", "injury", "table", "transfer"],
      }).success,
      false,
    );
  });

  it("accepts the additive personalization response field", () => {
    assert.equal(
      FeedConfigResponseSchema.safeParse({
        content_types: null,
        personalization_enabled: false,
      }).success,
      true,
    );
  });
});
