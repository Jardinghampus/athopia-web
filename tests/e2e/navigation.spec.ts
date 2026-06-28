import { test, expect } from '@playwright/test'

test.describe('Desktop navigation', () => {
  test('GlassNav visas på nyheter-sidan', async ({ page }) => {
    // GlassNav är i (app) layout — inte på root /
    await page.goto('/nyheter')
    const nav = page.locator('.glassnav')
    await expect(nav).toBeVisible({ timeout: 10000 })
  })

  test('Nyheter-sidan laddar korrekt', async ({ page }) => {
    await page.goto('/nyheter')
    await expect(page).toHaveURL(/\/nyheter/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('Forum-sidan laddar korrekt', async ({ page }) => {
    await page.goto('/forum')
    await expect(page).toHaveURL(/\/forum/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('Hamburger-knapp visas i header på mobil', async ({ page }) => {
    await page.goto('/nyheter')
    // md:hidden knapp i header — synlig vid 390px viewport
    const hamburger = page.locator('header button').first()
    await expect(hamburger).toBeVisible({ timeout: 10000 })
  })

  test('MobileNav-drawer öppnas vid klick på hamburger', async ({ page }) => {
    await page.goto('/nyheter')
    await page.locator('header button').first().click()
    // Drawern innehåller ATHOPIA-loggan och nav-länkar
    await expect(page.getByText('ATHOPIA').last()).toBeVisible({ timeout: 5000 })
    // Minst en nav-länk syns i drawern
    const drawerLinks = page.locator('nav a')
    await expect(drawerLinks.first()).toBeVisible({ timeout: 5000 })
  })
})
