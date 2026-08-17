import assert from "node:assert/strict";
import test from "node:test";
import {
  clerkUserIdFromSubscription,
  subscriptionFromInvoice,
  subscriptionIdFrom,
} from "./invoice-clerk";

test("läser subscription-id från äldre invoice.subscription", () => {
  const sub = subscriptionFromInvoice({ subscription: "sub_123" });
  assert.equal(subscriptionIdFrom(sub), "sub_123");
});

test("läser subscription från parent.subscription_details (API 2026)", () => {
  const sub = subscriptionFromInvoice({
    parent: { subscription_details: { subscription: "sub_parent" } },
  });
  assert.equal(subscriptionIdFrom(sub), "sub_parent");
});

test("expanderat subscription-objekt ger clerkUserId utan retrieve", () => {
  const sub = subscriptionFromInvoice({
    subscription: { id: "sub_exp", metadata: { clerkUserId: "user_1" } },
  });
  assert.equal(clerkUserIdFromSubscription(sub), "user_1");
});

test("saknad subscription → ingen kreditväg", () => {
  assert.equal(subscriptionFromInvoice({}), null);
  assert.equal(clerkUserIdFromSubscription(null), undefined);
});
