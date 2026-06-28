import { test, expect } from '@playwright/test'

test.describe('Forum-index', () => {
  test('Laddar och visar lag-lista', async ({ page }) => {
    await page.goto('/forum', { timeout: 20000 })
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Team-forum (DIF — mock-data)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forum/djurgardens-if', { timeout: 30000 })
  })

  test('Laddar och visar inlägg eller auth-redirect', async ({ page }) => {
    const url = page.url()
    if (url.includes('sign-in')) {
      // Clerk skyddar sidan — acceptabelt, testa att sign-in renderar
      await expect(page.locator('.cl-rootBox, [data-localization-key]').first()).toBeVisible({ timeout: 8000 })
    } else {
      // Publikt — mock-posts ska synas efter hydration
      await expect(page.getByText(/Isaks header/i).first()).toBeVisible({ timeout: 20000 })
    }
  })

  test('Sidan laddar utan 500', async ({ page }) => {
    // Minst en heading renderas
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('Compose-rad visas EJ utan inloggning', async ({ page }) => {
    // Compose-knappen är bara synlig för inloggade
    const composeBtn = page.getByRole('button', { name: /skriv ett inlägg/i })
    // Vänta lite för hydration, sen verifiera att den inte finns
    await page.waitForTimeout(2000)
    await expect(composeBtn).not.toBeVisible()
  })

  test('Layout är responsiv på mobil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    // Posts ska laddas
    await expect(page.getByText(/Isaks header/i).first()).toBeVisible({ timeout: 20000 })
    // Höger sidebar (lg:block) ska vara dold
    const rightSidebar = page.locator('aside').last()
    const box = await rightSidebar.boundingBox()
    // Om sidebar inte är visible (hidden via CSS) är box null
    if (box) {
      // Om den syns ändå — kolla att den inte är i viewport
      expect(box.x).toBeGreaterThanOrEqual(390)
    }
  })
})

test.describe('Post-tråd', () => {
  test('Navigering till forum-sidan fungerar', async ({ page }) => {
    const res = await page.goto('/forum/djurgardens-if')
    expect(res?.status()).toBeLessThan(500)
  })
})
