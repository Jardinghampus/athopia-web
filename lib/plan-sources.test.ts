import assert from "node:assert/strict";
import test from "node:test";
import { resolvePlanSources, readEffectivePlanSources } from "./plan-sources";

test("readEffectivePlanSources preserves legacy Stripe when StoreKit is free", () => {
  assert.deepEqual(
    readEffectivePlanSources({
      publicPlan: "elite",
      stripePlan: undefined,
      storekitPlan: "free",
    }),
    {
      stripePlan: "elite",
      storekitPlan: "free",
      effectivePlan: "elite",
    },
  );
});

test("readEffectivePlanSources uses explicit private metadata when present", () => {
  assert.deepEqual(
    readEffectivePlanSources({
      publicPlan: "elite",
      stripePlan: "pro",
      storekitPlan: "elite",
    }),
    {
      stripePlan: "pro",
      storekitPlan: "elite",
      effectivePlan: "elite",
    },
  );
});

test("a StoreKit sync preserves a legacy Stripe-backed public plan", () => {
  assert.deepEqual(
    resolvePlanSources({
      publicPlan: "elite",
      stripePlan: undefined,
      storekitPlan: undefined,
      source: "storekit",
      sourcePlan: "free",
    }),
    {
      stripePlan: "elite",
      storekitPlan: "free",
      effectivePlan: "elite",
    },
  );
});

test("the highest active payment source controls the effective plan", () => {
  assert.equal(
    resolvePlanSources({
      publicPlan: "elite",
      stripePlan: "pro",
      storekitPlan: "elite",
      source: "stripe",
      sourcePlan: "free",
    }).effectivePlan,
    "elite",
  );

  assert.equal(
    resolvePlanSources({
      publicPlan: "elite",
      stripePlan: "pro",
      storekitPlan: "elite",
      source: "storekit",
      sourcePlan: "free",
    }).effectivePlan,
    "pro",
  );
});
