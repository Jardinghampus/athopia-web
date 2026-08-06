import { test, expect } from '@playwright/test'

/**
 * Sökdialogens öppet-läge ligger i URL:en (`?sok=1`). Två krav följer av det:
 * knappen ska vara en riktig länk (så att ett klick före hydrering fungerar),
 * och back-knappen ska stänga dialogen i stället för att lämna sidan.
 */

const dialog = (p: import('@playwright/test').Page) => p.getByRole('dialog', { name: 'Sök' })

test('sökknappen är en länk med fungerande href', async ({ page }) => {
  await page.goto('/nyheter')
  const trigger = page.getByRole('link', { name: 'Sök', exact: true })
  await expect(trigger).toBeVisible()
  // Måste vara en navigerbar href — det är det som räddar klicket före hydrering.
  await expect(trigger).toHaveAttribute('href', '?sok=1')
})

test('?sok=1 i URL:en öppnar dialogen direkt', async ({ page }) => {
  await page.goto('/nyheter?sok=1')
  await expect(dialog(page)).toBeVisible()
})

test('klick öppnar utan navigering, back stänger', async ({ page }) => {
  await page.goto('/nyheter')
  await expect(dialog(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'Sök', exact: true }).click()
  await expect(dialog(page)).toBeVisible()
  expect(new URL(page.url()).searchParams.get('sok')).toBe('1')

  await page.goBack()
  await expect(dialog(page)).toHaveCount(0)
  expect(new URL(page.url()).searchParams.has('sok')).toBe(false)
  // Kvar på samma sida — back stängde dialogen, lämnade inte sidan.
  expect(new URL(page.url()).pathname).toBe('/nyheter')
})

test('Escape stänger och tar bort parametern', async ({ page }) => {
  await page.goto('/nyheter?sok=1')
  await expect(dialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toHaveCount(0)
  expect(new URL(page.url()).searchParams.has('sok')).toBe(false)
})
