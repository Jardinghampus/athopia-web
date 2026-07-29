import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getWhatsChanged, type WhatsChangedDataAccessor } from "@/lib/feed/whats-changed";

function accessor(
  feedOpens: string[],
  items: { id: string; title: string; href: string; publishedAt: string }[],
): WhatsChangedDataAccessor {
  return {
    async getRecentFeedOpens() {
      return feedOpens;
    },
    async getItemsSince(since: string) {
      return items.filter((i) => i.publishedAt > since);
    },
  };
}

describe("getWhatsChanged", () => {
  it("returns first-visit state when fewer than 2 feed_open events exist", async () => {
    const result = await getWhatsChanged(
      "user_1",
      {},
      accessor(["2026-07-26T10:00:00.000Z"], []),
    );
    assert.deepEqual(result, {
      firstVisit: true,
      since: null,
      newCount: 0,
      topItems: [],
    });
  });

  it("also treats zero feed_open events as first visit", async () => {
    const result = await getWhatsChanged("user_1", {}, accessor([], []));
    assert.equal(result.firstVisit, true);
  });

  it("uses the 2nd-most-recent feed_open as the since boundary", async () => {
    const result = await getWhatsChanged(
      "user_1",
      {},
      accessor(
        ["2026-07-26T12:00:00.000Z", "2026-07-25T09:00:00.000Z"],
        [],
      ),
    );
    assert.equal(result.firstVisit, false);
    if (!result.firstVisit) {
      assert.equal(result.since, "2026-07-25T09:00:00.000Z");
    }
  });

  it("counts only items published after the since boundary", async () => {
    const since = "2026-07-25T09:00:00.000Z";
    const items = [
      { id: "old", title: "Gammal nyhet", href: "/nyhet/old", publishedAt: "2026-07-25T08:00:00.000Z" },
      { id: "new1", title: "Ny nyhet 1", href: "/nyhet/new1", publishedAt: "2026-07-25T10:00:00.000Z" },
      { id: "new2", title: "Ny nyhet 2", href: "/nyhet/new2", publishedAt: "2026-07-25T11:00:00.000Z" },
    ];
    const result = await getWhatsChanged(
      "user_1",
      {},
      accessor(["2026-07-26T12:00:00.000Z", since], items),
    );
    assert.equal(result.firstVisit, false);
    if (!result.firstVisit) {
      assert.equal(result.newCount, 2);
      assert.equal(result.topItems.length, 2);
      assert.equal(
        result.topItems.every((i) => i.publishedAt > since),
        true,
      );
    }
  });

  it("caps topItems at 3 even when newCount is higher", async () => {
    const since = "2026-07-25T09:00:00.000Z";
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `n${i}`,
      title: `Nyhet ${i}`,
      href: `/nyhet/n${i}`,
      publishedAt: "2026-07-25T10:00:00.000Z",
    }));
    const result = await getWhatsChanged(
      "user_1",
      {},
      accessor(["2026-07-26T12:00:00.000Z", since], items),
    );
    assert.equal(result.firstVisit, false);
    if (!result.firstVisit) {
      assert.equal(result.newCount, 5);
      assert.equal(result.topItems.length, 3);
    }
  });
});
