import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { FeedModule } from "@/lib/feed/build-feed-modules";
import {
  extractHeadlineStackIds,
  extractHeadlineStackTitles,
  hasHeadlineStackModule,
} from "@/lib/feed/headline-stack";

function mod(
  partial: Partial<FeedModule> & Pick<FeedModule, "id" | "type">,
): FeedModule {
  return {
    schemaVersion: 1,
    tracking: { reason: "test", position: 4 },
    payload: {},
    ...partial,
  };
}

describe("headline-stack helpers", () => {
  it("detects non-empty headline_stack", () => {
    assert.equal(hasHeadlineStackModule([]), false);
    assert.equal(
      hasHeadlineStackModule([
        mod({ id: "p", type: "podcast" }),
        mod({
          id: "h",
          type: "headline_stack",
          payload: { headlines: [{ id: "a1", title: "T" }] },
        }),
      ]),
      true,
    );
    assert.equal(
      hasHeadlineStackModule([
        mod({ id: "h", type: "headline_stack", payload: { headlines: [] } }),
      ]),
      false,
    );
  });

  it("extracts headline ids and ignores other modules", () => {
    const ids = extractHeadlineStackIds([
      mod({ id: "p", type: "podcast" }),
      mod({
        id: "h",
        type: "headline_stack",
        payload: {
          headlines: [
            { id: "a1", title: "One" },
            { id: "a2", title: "Two" },
            { title: "no-id" },
          ],
        },
      }),
    ]);
    assert.deepEqual([...ids].sort(), ["a1", "a2"]);
  });

  it("extracts normalized headline titles", () => {
    const titles = extractHeadlineStackTitles([
      mod({
        id: "h",
        type: "headline_stack",
        payload: {
          headlines: [
            { id: "a1", title: "  AIJ vs DIF  " },
            { id: "a2", title: "" },
          ],
        },
      }),
    ]);
    assert.deepEqual([...titles], ["aij vs dif"]);
  });
});
