import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  BOTTEN,
  TOPP,
  arOnboarding,
  bannerPosition,
  bannerSlideY,
} from "./cookie-banner-position";

/**
 * Vakt för cookie-bannerns förankring.
 *
 * Bottenförankrad låg bannern över onboardingens primärknapp för varje ny
 * användare — och "lösningen" blev då att dölja samtyckesfrågan helt på den
 * skärmen. Båda felen ska förbli fixade.
 *
 * Geometrin går inte att mäta i e2e: `/onboarding` kräver inloggad session.
 * Beslutet gör det inte, och det är vad som testas här.
 */

test("onboarding förankras upptill, allt annat nedtill", () => {
  assert.equal(bannerPosition("/onboarding"), TOPP);
  assert.equal(bannerPosition("/onboarding/steg-2"), TOPP);
  assert.equal(bannerPosition("/nyheter"), BOTTEN);
  assert.equal(bannerPosition("/"), BOTTEN);
  assert.equal(bannerPosition(null), BOTTEN);
});

test("onboarding-detektionen är prefixbaserad, inte exakt", () => {
  assert.equal(arOnboarding("/onboarding"), true);
  assert.equal(arOnboarding("/onboarding/klar"), true);
  // Inte varje route som råkar innehålla ordet.
  assert.equal(arOnboarding("/nyheter/onboarding-guide"), false);
});

test("bannern glider in från den kant den hänger i", () => {
  assert.equal(bannerSlideY("/onboarding"), "-110%");
  assert.equal(bannerSlideY("/nyheter"), "110%");
});

test("bottenpositionen respekterar dockan", () => {
  // Utan --dock-inset låg bannern rakt över alla fem flikarna i GlassNav.
  assert.match(BOTTEN, /--dock-inset/);
  assert.match(BOTTEN, /safe-area-inset-bottom/);
});

test("komponenten döljer inte längre bannern på onboarding", () => {
  const src = readFileSync("components/CookieBanner.tsx", "utf8");
  // Regressionen som fixen ersatte: `visible && !onOnboarding`.
  assert.ok(
    !/!\s*onOnboarding/.test(src),
    "CookieBanner får inte villkora bort sig själv på onboarding — flytta den i stället"
  );
  assert.ok(
    src.includes("bannerPosition"),
    "CookieBanner ska hämta sin position från lib/cookie-banner-position"
  );
});
