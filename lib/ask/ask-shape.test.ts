import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldAnswer, shapeGroundingRows } from "@/lib/ask/ask-shape";

describe("shouldAnswer", () => {
  it("returns false for empty context — refuse without an LLM call", () => {
    assert.equal(shouldAnswer([]), false);
  });

  it("returns true when there is at least one grounding item", () => {
    assert.equal(
      shouldAnswer([
        { title: "t", summary: null, sourceName: null, url: "#", publishedAt: null },
      ]),
      true,
    );
  });
});

describe("shapeGroundingRows", () => {
  it("shapes raw Supabase rows into GroundingItem[]", () => {
    const rows = [
      {
        title: "AIK vinner derbyt",
        summary: "Sammanfattning här.",
        source_name: "Aftonbladet",
        url: "https://example.com/aik",
        slug: null,
        rights_status: "third_party",
        is_athopia_generated: false,
        published_at: "2026-07-20T10:00:00.000Z",
      },
    ];
    const shaped = shapeGroundingRows(rows);
    assert.equal(shaped.length, 1);
    assert.equal(shaped[0].title, "AIK vinner derbyt");
    assert.equal(shaped[0].sourceName, "Aftonbladet");
    assert.equal(shaped[0].publishedAt, "2026-07-20T10:00:00.000Z");
  });

  it("handles missing optional fields without throwing", () => {
    const shaped = shapeGroundingRows([{ title: "X" }]);
    assert.equal(shaped.length, 1);
    assert.equal(shaped[0].summary, null);
    assert.equal(shaped[0].sourceName, null);
  });

  it("returns [] for empty input", () => {
    assert.deepEqual(shapeGroundingRows([]), []);
  });
});
