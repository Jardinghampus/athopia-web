import assert from "node:assert/strict";
import test from "node:test";
import {
  ANNUAL_DISCOUNT,
  FOUNDER_OFFER,
  PRICING,
  amountFor,
  formatWeeklyKr,
  proPriceLabel,
  weeklyKr,
} from "./pricing";

// ── Årsrabatt: 20 %, inte 25 % ──────────────────────────────────────────────
test("årsrabatten är 20 % och årspriserna ligger strax UNDER exakt 20 %", () => {
  assert.equal(ANNUAL_DISCOUNT, 0.2);

  // Avrundat till jämna kronor under exakt rabatt — aldrig över, så rabatten vi
  // utlovar alltid är minst den vi ger.
  const exact = (monthly: number) => monthly * 12 * (1 - ANNUAL_DISCOUNT);
  assert.ok(PRICING.pro.yearly <= exact(PRICING.pro.monthly));
  assert.ok(PRICING.elite.yearly <= exact(PRICING.elite.monthly));
  assert.ok(FOUNDER_OFFER.pricing.yearly <= exact(FOUNDER_OFFER.pricing.monthly));

  assert.equal(PRICING.pro.yearly, 84900);
  assert.equal(PRICING.elite.yearly, 161900);
  assert.equal(FOUNDER_OFFER.pricing.yearly, 65900);
});

// ── Veckopris: facit ur speccens Appendix B ─────────────────────────────────
test("weeklyKr matchar facit för månads- och årsbelopp", () => {
  assert.equal(weeklyKr(6900, "month"), 16);
  assert.equal(weeklyKr(8900, "month"), 21); // 20,54 → 21
  assert.equal(weeklyKr(16900, "month"), 39);
  assert.equal(weeklyKr(65900, "year"), 13);
  assert.equal(weeklyKr(84900, "year"), 16);
  assert.equal(weeklyKr(161900, "year"), 31);
});

test("veckopriset rundar UPPÅT vid .5 så vi aldrig undersäljer", () => {
  // 21,66 kr/vecka i månadsbelopp = 9386 öre; .5 exakt ska bli nästa hela krona.
  const halfway = Math.round((52 * 20.5) / 12) * 100;
  assert.equal(weeklyKr(halfway, "month"), 21);
});

test("formatWeeklyKr är andra rad-text, inte hero", () => {
  assert.equal(formatWeeklyKr(6900), "16 kr/vecka");
  assert.equal(formatWeeklyKr(8900), "21 kr/vecka");
  assert.equal(formatWeeklyKr(84900, "year"), "16 kr/vecka");
});

// ── Founder är aldrig default ──────────────────────────────────────────────
test("amountFor ger Founder-pris ENBART när anroparen säger founder: true", () => {
  assert.equal(amountFor("pro", "month"), 8900);
  assert.equal(amountFor("pro", "month", { founder: false }), 8900);
  assert.equal(amountFor("pro", "month", { founder: true }), 6900);
  assert.equal(amountFor("pro", "year", { founder: true }), 65900);
});

test("Elite är aldrig ett Founder-erbjudande", () => {
  assert.equal(amountFor("elite", "month", { founder: true }), 16900);
  assert.equal(amountFor("elite", "year", { founder: true }), 161900);
});

test("proPriceLabel speglar betraktaren, inte en global flagga", () => {
  assert.equal(proPriceLabel(true), "69 kr/mån");
  assert.equal(proPriceLabel(false), "89 kr/mån");
});

// ── Regressionsvakt ─────────────────────────────────────────────────────────
test("FOUNDER_OFFER har ingen `active`-boolean kvar", () => {
  // Den var hårdkodad `true` och lovade 69 kr/mån för alltid till hela internet,
  // oavsett hur många av de 500 platserna som fanns kvar. Potten
  // (`lib/founder-offer.ts`) är den enda sanningen numera.
  assert.equal("active" in FOUNDER_OFFER, false);
  assert.equal(FOUNDER_OFFER.cap, 500);
});
