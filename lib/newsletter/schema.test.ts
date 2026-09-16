import assert from "node:assert/strict";
import test from "node:test";
import {
  isUniqueViolation,
  mapBeehiivEvent,
  NewsletterPreferencesPatchSchema,
  NewsletterSignupSchema,
  newsletterIdentityFromClerk,
  normalizeNewsletterPlan,
  redactWebhookPayload,
} from "./schema";

test("signup requires valid team, cadence and explicit consent", () => {
  assert.equal(
    NewsletterSignupSchema.safeParse({
      email: "supporter@example.com",
      teamSlug: "djurgarden",
      cadence: "standard",
      consent: true,
      honeypot: "",
    }).success,
    true,
  );
  assert.equal(
    NewsletterSignupSchema.safeParse({
      email: "not-an-email",
      teamSlug: "Djurgården",
      cadence: "daily",
      consent: false,
    }).success,
    false,
  );
  assert.equal(
    NewsletterPreferencesPatchSchema.safeParse({}).success,
    false,
  );
});

test("Clerk identity owns id, primary email and normalized plan", () => {
  const identity = newsletterIdentityFromClerk({
    id: "user_123",
    primaryEmailAddressId: "primary",
    emailAddresses: [
      { id: "secondary", emailAddress: "other@example.com" },
      { id: "primary", emailAddress: " Owner@Example.com " },
    ],
    publicMetadata: { plan: "founder-pro" },
  });
  assert.deepEqual(identity, {
    clerkUserId: "user_123",
    email: "owner@example.com",
    plan: "pro",
  });
  assert.equal(
    newsletterIdentityFromClerk({ id: "user_123", emailAddresses: [] }),
    null,
  );
});

test("plan snapshots preserve elite and map founder cohorts to pro", () => {
  assert.equal(normalizeNewsletterPlan("free"), "free");
  assert.equal(normalizeNewsletterPlan("founder"), "pro");
  assert.equal(normalizeNewsletterPlan("founder_pro"), "pro");
  assert.equal(normalizeNewsletterPlan("pro"), "pro");
  assert.equal(normalizeNewsletterPlan("elite"), "elite");
  assert.equal(normalizeNewsletterPlan("unknown"), "free");
});

test("Beehiiv lifecycle events map without payload PII", () => {
  assert.deepEqual(mapBeehiivEvent("subscription.confirmed"), {
    kind: "subscriber",
    status: "active",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.paused"), {
    kind: "subscriber",
    status: "paused",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.unsubscribed"), {
    kind: "subscriber",
    status: "unsubscribed",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.bounced"), {
    kind: "subscriber",
    status: "bounced",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.complained"), {
    kind: "subscriber",
    status: "complained",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.updated", "resumed"), {
    kind: "subscriber",
    status: "active",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.created", "pending"), {
    kind: "ignore",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.created", "active"), {
    kind: "subscriber",
    status: "active",
  });
  assert.deepEqual(mapBeehiivEvent("subscription.deleted"), {
    kind: "subscriber",
    status: "unsubscribed",
    deleteLocal: true,
  });
  assert.deepEqual(mapBeehiivEvent("post.updated", "scheduled"), {
    kind: "post",
    postState: "scheduled",
  });
  assert.deepEqual(mapBeehiivEvent("post.updated", "sent"), {
    kind: "post",
    postState: "sent",
  });
  assert.deepEqual(mapBeehiivEvent("post.sent"), {
    kind: "post",
    postState: "sent",
  });

  const redacted = redactWebhookPayload("subscription.confirmed", {
    id: "sub_123",
    email: "secret@example.com",
    name: "Supporter",
  });
  assert.equal(redacted.subscriptionId, "sub_123");
  assert.equal("email" in redacted, false);
  assert.equal("name" in redacted, false);
});

test("unique violation helper makes webhook retries idempotency-safe", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation({ code: "PGRST116" }), false);
  assert.equal(isUniqueViolation(null), false);
});
