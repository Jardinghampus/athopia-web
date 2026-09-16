import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Vakt för de mobila UX-reglerna (`../../../context/mobile_ux_rules.md`).
 *
 * Mäts i renderad DOM på telefonbredd, inte genom kodläsning — en regel som
 * bara är sann i källkoden är inte sann för supportern. Det som INTE går att
 * mäta i en webbläsare (loading-täckning, navordningen som datastruktur) ligger
 * i `lib/loading-coverage.test.ts` och `lib/nav.test.ts` i stället.
 *
 * Mätningarna sker i ett enda `page.evaluate` per route. Att loopa
 * `locator.boundingBox()` över ~60 kontroller kostade en round-trip per
 * element och sprängde testtimeouten innan den hann mäta klart.
 */

const TELEFON = { width: 390, height: 844 };
const MIN_TAP = 44;

/** Publika routes som utgör produktens mobila kärna. */
const KARNROUTES = ["/nyheter", "/match", "/allsvenskan", "/mitt-lag", "/lag/mjallby"];

/**
 * Kontrollytan enligt regel 6. Länkar i löpande text och brödsmulor räknas
 * inte — de är typografi, inte kontroller, och 44 px där spärrar ut brödtexten.
 */
const KONTROLLER = [
  "button",
  "[role=button]",
  "[role=tab]",
  "[data-cta]",
  "header a",
  ".glassnav a",
  'nav:not([data-slot="breadcrumb"]) a',
].join(", ");

type Mätning = {
  små: string[];
  primärCtas: number;
  dock: { label: string; href: string | null; w: number; h: number }[];
  pullToRefresh: number;
  kantsvep: string | null;
  mainTom: boolean;
};

/** Öppnar en route och mäter hela regelytan i ett anrop. */
async function mät(page: Page, route: string): Promise<Mätning> {
  // `load` väntar på varje bild på en dynamisk sida; DOM räcker för att mäta.
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".glassnav a").first()).toBeVisible({ timeout: 30000 });

  return page.evaluate(
    ({ sel, min }) => {
      const box = (el: Element) => el.getBoundingClientRect();
      const synlig = (el: Element) => {
        const r = box(el);
        return r.width > 0 && r.height > 0;
      };

      const små = [...document.querySelectorAll(sel)]
        .filter(synlig)
        .filter((el) => box(el).width < min || box(el).height < min)
        .map((el) => {
          const r = box(el);
          const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30);
          return `"${label}" ${Math.round(r.width)}x${Math.round(r.height)}`;
        });

      const dock = [...document.querySelectorAll(".glassnav a")].map((a) => {
        const r = box(a);
        return {
          label: a.querySelector(".glassnav__label")?.textContent ?? "",
          href: a.getAttribute("href"),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });

      const main = document.querySelector("#main");

      return {
        små,
        primärCtas: [...document.querySelectorAll('[data-cta="primary"]')].filter(synlig).length,
        dock,
        pullToRefresh: document.querySelectorAll("[data-pull-to-refresh]").length,
        kantsvep:
          document.querySelector("[data-edge-swipe-back]")?.getAttribute("data-edge-swipe-back") ??
          null,
        mainTom: !main || main.textContent!.trim().length === 0,
      };
    },
    { sel: KONTROLLER, min: MIN_TAP },
  );
}

test.describe("Mobila UX-regler", () => {
  test.use({ viewport: TELEFON });

  // Ett test per route, inte en loop: varje `force-dynamic`-route kostar
  // tiotals sekunder att rendera, och fem i samma test sprängde testtimeouten.
  for (const route of KARNROUTES) {
    test(`${route} följer nav-, träffyte-, CTA- och skelettreglerna`, async ({ page }) => {
      const m = await mät(page, route);

      // Regel 3 — Hem först, Profil sist, max fem flikar.
      expect(m.dock.length, `${route}: fler än fem flikar`).toBeLessThanOrEqual(5);
      expect(m.dock[0]?.label, `${route}: Hem ligger inte först`).toBe("Hem");
      expect(m.dock[0]?.href).toBe("/mitt-lag");
      expect(m.dock.at(-1)?.label, `${route}: Profil ligger inte sist`).toBe("Profil");
      expect(m.dock.at(-1)?.href).toBe("/profil");

      // Regel 6 — Fitts's Law.
      expect(m.små, `${route}: kontroller under ${MIN_TAP} px: ${m.små.join(", ")}`).toEqual([]);

      // Regel 4 — en framhävd handling per vy.
      expect(m.primärCtas, `${route}: fler än en primär CTA`).toBeLessThanOrEqual(1);

      // Regel 1 + 2 — gesthanterarna monteras en gång, av app-shellen.
      expect(m.pullToRefresh, `${route}: pull-to-refresh saknas eller är dubblerad`).toBe(1);
      // "native" = plattformen äger gesten (webbläsarläge), "active" = vi gör det.
      expect(m.kantsvep, `${route}: kantsvep-hanteraren saknas`).toMatch(/active|native/);

      // Regel 15 — aldrig en tom skärm.
      expect(m.mainTom, `${route}: main är tom`).toBe(false);
    });
  }

  // ── Regel 5: tryck på aktiv flik scrollar till toppen ───────────────────

  test("tryck på den aktiva fliken scrollar upp i stället för att navigera", async ({ page }) => {
    await page.goto("/nyheter", { waitUntil: "domcontentloaded" });
    const aktiv = page.locator('.glassnav a[aria-current="page"]');
    await expect(aktiv).toBeVisible({ timeout: 30000 });

    // Sidan måste vara längre än fönstret för att kunna scrollas alls.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight), { timeout: 20000 })
      .toBeGreaterThan(1500);

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 10000 })
      .toBeGreaterThan(200);

    await aktiv.click();

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 10000 })
      .toBeLessThan(40);
    // Klicket får inte navigera bort — det är samma sida.
    await expect(page).toHaveURL(/\/nyheter/);
  });

  // ── Regel 11: X stänger ─────────────────────────────────────────────────

  test("sökdialogen stängs med ett X i hörnet", async ({ page }) => {
    // Öppet-läget ligger i URL:en, så dialogen går att nå direkt.
    await page.goto("/nyheter?sok=1", { waitUntil: "domcontentloaded" });
    const dialog = page.getByRole("dialog", { name: "Sök" });
    await expect(dialog).toBeVisible({ timeout: 30000 });

    const close = dialog.getByRole("button", { name: "Stäng", exact: true });
    await expect(close).toBeVisible();
    const box = await close.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TAP);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP);

    await close.click();
    await expect(dialog).toBeHidden();
  });
});

/**
 * Källkodsvakter för beteende som inte går att observera utifrån.
 *
 * En IntersectionObserver utan `rootMargin` triggar först när sentinelen är
 * synlig — alltså när scrollen redan tagit slut. Att skilja "hämtade i tid"
 * från "hämtade precis för sent" i en Playwright-körning är flaky; att se att
 * marginalen finns i koden är det inte.
 */
test.describe("Källkodsvakter", () => {
  test("infinite scroll pre-laddar (rootMargin satt på sentinelen)", () => {
    for (const file of [
      "app/(app)/feed/FeedClient.tsx",
      "components/news/PrefetchNextPage.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} saknar rootMargin — flödet hämtar för sent`).toContain("rootMargin");
    }
  });

  test("bara app-shellen äger pull-to-refresh-gesten", () => {
    const shell = readFileSync("components/layout/PullToRefreshShell.tsx", "utf8");
    expect(shell).toContain("touchstart");
    // Den gamla per-vy-komponenten är borta; nya ytor hookar på via usePullRefresh.
    const hook = readFileSync("hooks/usePullRefresh.ts", "utf8");
    expect(hook).toContain("PULL_REFRESH_EVENT");
  });

  test("utkast sparas lokalt i forumets composer", () => {
    const src = readFileSync("components/forum/ComposePost.tsx", "utf8");
    expect(src, "ComposePost sparar inte utkast — regel 19").toContain("useDraft");
  });

  test("app-shellen bevarar scrollposition per route", () => {
    const layout = readFileSync("app/(app)/layout.tsx", "utf8");
    expect(layout, "layout saknar ScrollRestore — regel 16").toContain("ScrollRestore");
    const restore = readFileSync("components/ux/ScrollRestore.tsx", "utf8");
    expect(restore).toContain("useScrollRestoration");
  });

  test("forumets klientlista hakar på shellens pull-to-refresh", () => {
    const src = readFileSync("app/(app)/forum/[teamSlug]/ForumClient.tsx", "utf8");
    expect(src, "ForumClient saknar usePullRefresh — regel 1").toContain("usePullRefresh");
  });

  test("push-prompten dyker inte upp av sig själv efter ett besöksantal", () => {
    const src = readFileSync("components/PwaInstallBanner.tsx", "utf8");
    expect(src, "PwaInstallBanner får inte begära push via visit-count — regel 20").not.toContain(
      "visitCount",
    );
    expect(src).not.toContain("requestPermission");
  });
});
