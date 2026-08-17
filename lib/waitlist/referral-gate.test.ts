import assert from "node:assert/strict";
import test from "node:test";
import { referralCreditDecision, REFERRAL_CREDIT_CAP } from "./referral-gate";

const referred = {
  referred_by: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  referral_credits_granted: 0,
  favorite_team: "djurgarden",
};

const referrer = {
  clerk_user_id: "user_abc",
  referral_credits_granted: 0,
  favorite_team: "djurgarden",
};

test("trialfaktura (0 kr) ger ingen kredit", () => {
  assert.equal(
    referralCreditDecision({ amountPaidOre: 0, referred, referrer }),
    "unpaid",
  );
});

test("betald faktura + samma lag + under tak → grant", () => {
  assert.equal(
    referralCreditDecision({ amountPaidOre: 8900, referred, referrer }),
    "grant",
  );
});

test("redan utbetald rad är idempotent", () => {
  assert.equal(
    referralCreditDecision({
      amountPaidOre: 8900,
      referred: { ...referred, referral_credits_granted: 1 },
      referrer,
    }),
    "already_granted",
  );
});

test("olika lag → ingen kredit", () => {
  assert.equal(
    referralCreditDecision({
      amountPaidOre: 8900,
      referred,
      referrer: { ...referrer, favorite_team: "aik" },
    }),
    "different_team",
  );
});

test("tak 3 krediter per år", () => {
  assert.equal(REFERRAL_CREDIT_CAP, 3);
  assert.equal(
    referralCreditDecision({
      amountPaidOre: 8900,
      referred,
      referrer: { ...referrer, referral_credits_granted: 3 },
    }),
    "cap_reached",
  );
});
