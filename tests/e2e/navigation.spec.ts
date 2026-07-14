import { test, expect } from "@playwright/test";

test.describe("Desktop navigation", () => {
  test("Nyheter-sidan laddar korrekt", async ({ page }) => {
    await page.goto("/nyheter");
    await expect(page).toHaveURL(/\/nyheter/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });

  test("Forum-sidan laddar korrekt", async ({ page }) => {
    await page.goto("/forum");
    await expect(page).toHaveURL(/\/forum/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });

  test("Mitt lag-sidan laddar utan 5xx", async ({ page }) => {
    const res = await page.goto("/mitt-lag");
    expect(res?.status()).toBeLessThan(500);
  });
});

test.describe("Mobile TabBar", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("TabBar visar fyra flikar", async ({ page }) => {
    await page.goto("/nyheter");
    const tabBar = page.getByRole("navigation").filter({ hasText: "Mitt lag" });
    await expect(tabBar).toBeVisible({ timeout: 10000 });
    await expect(tabBar.getByRole("link", { name: "Mitt lag" })).toBeVisible();
    await expect(tabBar.getByRole("link", { name: "Flöde" })).toBeVisible();
    await expect(tabBar.getByRole("link", { name: "Forum" })).toBeVisible();
    await expect(tabBar.getByRole("link", { name: "Mer" })).toBeVisible();
  });

  test("Flöde-flik är aktiv på /nyheter", async ({ page }) => {
    await page.goto("/nyheter");
    const flow = page.getByRole("navigation").filter({ hasText: "Flöde" }).getByRole("link", {
      name: "Flöde",
    });
    await expect(flow).toHaveAttribute("aria-current", "page");
  });

  test("Hamburger-meny öppnas", async ({ page }) => {
    await page.goto("/nyheter");
    const hamburger = page.locator("header button").first();
    await expect(hamburger).toBeVisible({ timeout: 10000 });
    await hamburger.click();
    await expect(page.getByText("ATHOPIA").last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("nav a").first()).toBeVisible({ timeout: 5000 });
  });
});
