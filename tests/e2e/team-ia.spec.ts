import { test, expect, type Page } from "@playwright/test";

/**
 * Låser fast informationsarkitekturen som produktbriefen kräver.
 *
 * Regressionerna dessa test skyddar mot är alla verkliga och fanns i produktion
 * 2026-08-06:
 *  - Laget hade TVÅ flikrader (hubbens `?tab=` och layoutens routes) där samma
 *    etikett "Statistik" pekade på olika innehåll och raden byttes ut mitt i
 *    navigeringen.
 *  - "Alla nyheter" från Allsvenskan landade i användarens favoritlagsflöde.
 *  - Ett aktivt lagfilter visades bara som grå brödtext och gick inte att ta bort.
 */

const TEAM = "aik";
const SECTIONS = [
  "",
  "/nyheter",
  "/analys",
  "/matcher",
  "/trupp",
  "/statistik",
  "/poddar",
] as const;

/** Etiketterna i lagets flikrad, i ordning. */
async function navLabels(page: Page): Promise<string[]> {
  const nav = page.getByRole("navigation", { name: "Lagsektioner" });
  return (await nav.getByRole("link").allInnerTexts()).map((t) => t.trim());
}

test.describe("Lagets navigation", () => {
  test("samma flikrad, samma ordning, på alla lagrutter", async ({ page }) => {
    let reference: string[] | null = null;

    for (const section of SECTIONS) {
      await page.goto(`/lag/${TEAM}${section}`);
      const nav = page.getByRole("navigation", { name: "Lagsektioner" });

      // Exakt EN flikrad — två rader var hela problemet.
      await expect(nav).toHaveCount(1);

      const labels = await navLabels(page);
      expect(labels.length, `${section || "/"} saknar flikar`).toBeGreaterThan(0);

      if (reference === null) reference = labels;
      else
        expect(labels, `flikraden ändrades på ${section || "/"}`).toEqual(reference);
    }

    // "Statistik" får bara förekomma en gång — annars betyder den två saker.
    expect(reference!.filter((l) => l === "Statistik")).toHaveLength(1);
  });

  test("aktiv sektion markeras med aria-current, inte bara färg", async ({ page }) => {
    await page.goto(`/lag/${TEAM}/analys`);
    const current = page
      .getByRole("navigation", { name: "Lagsektioner" })
      .locator("[aria-current='page']");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Analys");
  });

  test("gamla rutter 308:ar till sina nya namn", async ({ request }) => {
    for (const [from, to] of [
      [`/lag/${TEAM}/podcasts`, `/lag/${TEAM}/poddar`],
      [`/lag/${TEAM}/sammanfattning`, `/lag/${TEAM}/analys`],
    ]) {
      const res = await request.get(from!, { maxRedirects: 0 });
      expect(res.status(), `${from} ska permanent-redirecta`).toBe(308);
      expect(res.headers()["location"]).toContain(to!);
    }
  });
});

test.describe("Nyhetsflödets scope", () => {
  test("'Alla nyheter' från Allsvenskan ger hela ligan", async ({ page }) => {
    await page.goto("/allsvenskan");
    const link = page.getByRole("link", { name: /Alla nyheter/i }).first();
    await link.scrollIntoViewIfNeeded();

    // Länken måste bära scopet redan i href:en — annars är destinationen
    // beroende av vem som är inloggad, vilket var hela buggen.
    await expect(link).toHaveAttribute("href", /scope=allsvenskan/);

    // waitForURL startas FÖRE klicket, och vantar pa "commit" i stallet for
    // "load": pa mobilviewporten fyrade load-eventet inte inom 90 s (streamad
    // RSC-respons), sa testet timeoutade trots att navigeringen redan skett.
    await Promise.all([
      page.waitForURL(/scope=allsvenskan/, { waitUntil: "commit" }),
      link.click(),
    ]);
    // Rubriken ska säga vad flödet faktiskt är.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/ALLSVENSKAN/i);
    await expect(page.getByText("Hela Allsvenskan")).toBeVisible();
  });

  test("aktivt lagfilter syns och tas bort med ett klick", async ({ page }) => {
    await page.goto("/nyheter?lag=AIK");

    const remove = page.getByRole("link", { name: /Ta bort filter Lag: AIK/i });
    await expect(remove).toBeVisible();

    await remove.click();
    // Ett klick → filtret borta ur URL:en.
    await expect(page).not.toHaveURL(/lag=AIK/);
    await expect(
      page.getByRole("link", { name: /Ta bort filter Lag: AIK/i }),
    ).toHaveCount(0);
  });
});
