import { test, expect } from "@playwright/test";

/**
 * Nyhetskorten ska visa vad artikeln HANDLAR om, inte bara var den kommer ifrån.
 *
 * Bakgrund: 96,7 % av artiklarna har lagkoppling och Echo klassificerar fem
 * händelsetyper, men korten visade enbart källa + tid. Utåt läste det som en
 * rubrikaggregator trots att klassificeringen redan gjort jobbet.
 */

test("flödet visar lag och händelsetyp på korten", async ({ page }) => {
  await page.goto("/nyheter?scope=allsvenskan&sort=latest");

  const feed = page.locator("main");
  await expect(feed.getByText(/Transfer|Match|Analys|Skada/).first()).toBeVisible();

  // Minst ett lagnamn ska finnas i metaraderna.
  const teamNames = await page
    .locator('[class*="font-semibold"][class*="text-foreground"]')
    .allInnerTexts();
  expect(teamNames.some((t) => t.trim().length > 1)).toBe(true);
});

test("metaraden skapar inga nästlade länkar", async ({ page }) => {
  await page.goto("/nyheter?scope=allsvenskan&sort=latest");

  // <a> inuti <a> är ogiltig HTML och fångar tangentbordsfokus fel — korten är
  // redan länkar, så lagnamnen får inte vara det inuti dem.
  const nested = await page.locator("a a").count();
  expect(nested).toBe(0);
});
