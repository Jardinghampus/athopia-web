import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { articleIdForDiscussionCount } from "@/lib/feed/discussion-counts";

describe("articleIdForDiscussionCount", () => {
  it("strips hero article- prefix", () => {
    assert.equal(
      articleIdForDiscussionCount("article-abc-123"),
      "abc-123",
    );
  });

  it("leaves plain article ids unchanged", () => {
    assert.equal(articleIdForDiscussionCount("abc-123"), "abc-123");
  });
});
