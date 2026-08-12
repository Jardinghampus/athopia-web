import { test } from "node:test";
import assert from "node:assert/strict";
import { visitorIdFrom } from "./visitor.js";

const reqWithIp = (ip?: string) =>
  new Request("https://athopia.se/api/analytics/event", {
    headers: ip ? { "x-forwarded-for": ip } : {},
  });

test("inloggad besökare identifieras av sitt Clerk-id", () => {
  assert.equal(visitorIdFrom(reqWithIp("1.2.3.4"), "user_abc"), "user_abc");
});

test("samma IP ger samma id, olika IP ger olika", () => {
  const a = visitorIdFrom(reqWithIp("1.2.3.4"), null);
  const b = visitorIdFrom(reqWithIp("1.2.3.4"), null);
  const c = visitorIdFrom(reqWithIp("5.6.7.8"), null);

  assert.equal(a, b, "stabil över anrop, annars går retention inte att mäta");
  assert.notEqual(a, c, "olika besökare får inte kollapsa till samma hink");
});

test("IP:n går inte att läsa ut ur id:t", () => {
  const id = visitorIdFrom(reqWithIp("1.2.3.4"), null);
  assert.ok(id.startsWith("anon::"));
  assert.ok(!id.includes("1.2.3.4"));
  assert.equal(id.length, "anon::".length + 16);
});

test("saknad IP kraschar inte, men blir inte heller den gamla enda hinken", () => {
  const id = visitorIdFrom(reqWithIp(), null);
  assert.ok(id.startsWith("anon::"));
  assert.notEqual(id, "anon");
});

test("första IP i x-forwarded-for används, inte hela kedjan", () => {
  const direkt = visitorIdFrom(reqWithIp("1.2.3.4"), null);
  const viaProxy = visitorIdFrom(reqWithIp("1.2.3.4, 9.9.9.9"), null);
  assert.equal(direkt, viaProxy);
});
