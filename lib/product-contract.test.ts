import assert from "node:assert/strict";
import test from "node:test";
import { isStoreKitRevocationNotification } from "./product-contract";

test("StoreKit revocation notifications are recognized", () => {
  assert.equal(isStoreKitRevocationNotification("EXPIRED"), true);
  assert.equal(isStoreKitRevocationNotification("REFUND"), true);
  assert.equal(isStoreKitRevocationNotification("DID_RENEW"), false);
  assert.equal(isStoreKitRevocationNotification(undefined), false);
});
