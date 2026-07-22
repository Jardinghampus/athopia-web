import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { secretsEqual } from "@/lib/secrets";

describe("secretsEqual", () => {
  it("matches equal secrets", () => {
    assert.equal(secretsEqual("abc123", "abc123"), true);
  });

  it("rejects mismatch and missing values", () => {
    assert.equal(secretsEqual("abc123", "abc124"), false);
    assert.equal(secretsEqual("abc", "abcd"), false);
    assert.equal(secretsEqual(null, "x"), false);
    assert.equal(secretsEqual("x", undefined), false);
    assert.equal(secretsEqual("", "x"), false);
  });
});
