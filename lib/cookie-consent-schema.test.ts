import assert from "node:assert/strict";
import test from "node:test";
import { CookieConsentRequestSchema } from "./cookie-consent-schema";

test("accepts the numeric consent version emitted by CookieBanner", () => {
  const result = CookieConsentRequestSchema.safeParse({
    analytics: false,
    marketing: false,
    version: 1,
    savedAt: "2026-07-24T00:00:00.000Z",
  });

  assert.equal(result.success, true);
});

test("rejects non-integer and implausible consent versions", () => {
  for (const version of [0, 1.5, 101, "1"]) {
    const result = CookieConsentRequestSchema.safeParse({
      analytics: false,
      marketing: false,
      version,
      savedAt: "2026-07-24T00:00:00.000Z",
    });

    assert.equal(result.success, false);
  }
});
