import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAthopiaSummary,
  parseModelSummaryJson,
  sampleChunkTexts,
  sampleTranscript,
  summaryTeaser,
  formatTimestamp,
} from "./summary";

test("parseAthopiaSummary kräver headline, minst tre bullets och generatedAt", () => {
  assert.equal(parseAthopiaSummary(null), null);
  assert.equal(
    parseAthopiaSummary({
      athopia_summary: { headline: "Hej", bullets: ["a", "b"], generatedAt: "2026-09-15T00:00:00Z" },
    }),
    null,
  );
  const ok = parseAthopiaSummary({
    athopia_summary: {
      headline: "Derbyt avgjordes i första",
      bullets: ["Bajen pressade", "AIK ställde om", "Domaren diskuterades"],
      generatedAt: "2026-09-15T00:00:00Z",
    },
  });
  assert.equal(ok?.headline, "Derbyt avgjordes i första");
  assert.equal(ok?.bullets.length, 3);
});

test("summaryTeaser klipper första punkten", () => {
  const summary = parseAthopiaSummary({
    athopia_summary: {
      headline: "H",
      bullets: ["x".repeat(200), "b", "c"],
      generatedAt: "2026-09-15T00:00:00Z",
    },
  });
  assert.ok(summary);
  const teaser = summaryTeaser(summary, 40);
  assert.ok(teaser.endsWith("…"));
  assert.ok(teaser.length <= 41);
});

test("sampleChunkTexts sprider urval över avsnittet", () => {
  const chunks = Array.from({ length: 20 }, (_, i) => ({
    text: `chunk-${i}`,
    chunkIndex: i,
  }));
  const sampled = sampleChunkTexts(chunks, 200);
  assert.match(sampled, /chunk-0/);
  assert.match(sampled, /chunk-19/);
});

test("sampleTranscript tar fönster när texten är lång", () => {
  const text = "abcdefghij".repeat(800);
  const sampled = sampleTranscript(text, 100);
  assert.ok(sampled.includes("---"));
  assert.ok(sampled.length <= 200);
});

test("parseModelSummaryJson tål extra text runt JSON", () => {
  const parsed = parseModelSummaryJson(
    'Här: {"headline":"Läget","bullets":["Ett","Två","Tre"]} klar.',
  );
  assert.equal(parsed?.headline, "Läget");
  assert.equal(parsed?.bullets.length, 3);
});

test("formatTimestamp formaterar minuter:sekunder", () => {
  assert.equal(formatTimestamp(125), "2:05");
  assert.equal(formatTimestamp(null), null);
});
