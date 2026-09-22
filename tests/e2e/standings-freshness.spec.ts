import { test, expect } from "@playwright/test";

/**
 * Tabellen räknas om varje natt men ur fixtures som inte fått nya resultat
 * sedan Sportmonks-planen slutade täcka Allsvenskan. Mätt 2026-09-22 visade
 * produktionen Sirius på 14 spelade matcher medan serien spelat 22 omgångar,
 * utan att något på sidan antydde det.
 *
 * Vakten säkrar att ytan är ärlig: antingen är datan färsk, eller så står det
 * vilken tidpunkt den gäller. Aldrig gammal data presenterad som aktuell.
 */
test("tabellen talar om hur aktuell den är", async ({ page, request }) => {
  const res = await request.get("/api/standings");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    standings: unknown[];
    coveredThrough?: string | null;
    stale?: boolean;
  };
  test.skip(body.standings.length === 0, "ingen tabelldata i miljön");

  await page.goto("/allsvenskan/tabell");
  const notice = page.getByTestId("standings-staleness");

  if (body.stale) {
    await expect(notice).toBeVisible();
    // Måste namnge tidpunkten — "kan vara gammal" hjälper ingen.
    await expect(notice).toContainText(/till och med|kan inte bekräfta/);
  } else {
    await expect(notice).toHaveCount(0);
  }
});
