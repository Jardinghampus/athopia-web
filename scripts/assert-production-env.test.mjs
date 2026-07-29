import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionAuthEnv } from "./assert-production-env.mjs";

test("allows development keys outside production", () => {
  assert.doesNotThrow(() =>
    assertProductionAuthEnv({
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      CLERK_SECRET_KEY: "sk_test_example",
    })
  );
});

test("blocks missing or development Clerk keys in production", () => {
  assert.throws(
    () =>
      assertProductionAuthEnv({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        CLERK_SECRET_KEY: "sk_test_example",
      }),
    /Production deploy blocked: Clerk development keys are configured/
  );
});

test("allows Clerk live keys in production", () => {
  assert.doesNotThrow(() =>
    assertProductionAuthEnv({
      VERCEL_ENV: "production",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
      CLERK_SECRET_KEY: "sk_live_example",
    })
  );
});
