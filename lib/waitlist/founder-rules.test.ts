import assert from "node:assert/strict";
import test from "node:test";
import { amountFor } from "../pricing";
import { claimsPotSeat, isEntitledToFounder } from "./founder-rules";

const founderRow = { cohort: "founder" as const };
const regularRow = { cohort: "regular" as const };

// ── Potten slut ────────────────────────────────────────────────────────────
test("pott slut + ingen waitlist-rad → INTE founder, alltså 8900 öre", () => {
  const founder = isEntitledToFounder({
    plan: "pro",
    waitlist: null,
    founderOfferPublic: false,
  });
  assert.equal(founder, false);
  assert.equal(amountFor("pro", "month", { founder }), 8900);
});

test("pott slut + waitlist-kohort founder → fortfarande 6900 öre (låst avtal)", () => {
  const founder = isEntitledToFounder({
    plan: "pro",
    waitlist: founderRow,
    founderOfferPublic: false,
  });
  assert.equal(founder, true);
  assert.equal(amountFor("pro", "month", { founder }), 6900);
});

test("pott slut + waitlist-kohort regular → 8900 öre", () => {
  assert.equal(
    isEntitledToFounder({ plan: "pro", waitlist: regularRow, founderOfferPublic: false }),
    false,
  );
});

// ── Potten öppen ───────────────────────────────────────────────────────────
test("pott öppen + walk-in utan waitlist-rad → founder", () => {
  assert.equal(
    isEntitledToFounder({ plan: "pro", waitlist: null, founderOfferPublic: true }),
    true,
  );
});

test("waitlist-läge: walk-in får INTE founder, kohort founder får det", () => {
  assert.equal(
    isEntitledToFounder({
      plan: "pro",
      waitlist: null,
      founderOfferPublic: true,
      waitlistMode: true,
    }),
    false,
  );
  assert.equal(
    isEntitledToFounder({
      plan: "pro",
      waitlist: founderRow,
      founderOfferPublic: true,
      waitlistMode: true,
    }),
    true,
  );
});

test("pott öppen + waitlist-kohort regular → ALDRIG founder", () => {
  // Kohorten är tilldelad. Kunde hen köpa runt den vore kön meningslös.
  assert.equal(
    isEntitledToFounder({ plan: "pro", waitlist: regularRow, founderOfferPublic: true }),
    false,
  );
});

// ── Elite ──────────────────────────────────────────────────────────────────
test("Elite är aldrig founder, oavsett kohort och pott", () => {
  assert.equal(
    isEntitledToFounder({ plan: "elite", waitlist: founderRow, founderOfferPublic: true }),
    false,
  );
});

// ── Pott-platser ───────────────────────────────────────────────────────────
test("waitlist-founder tar ingen NY pott-plats; walk-in gör det", () => {
  assert.equal(claimsPotSeat(founderRow), false);
  assert.equal(claimsPotSeat(null), true);
  assert.equal(claimsPotSeat(regularRow), true);
});
