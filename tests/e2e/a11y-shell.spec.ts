import { test, expect } from '@playwright/test'

/**
 * Regressionsvakt för appskalet (header, skip-link, bottendock).
 * Dessa brister är osynliga tills någon tabbar sig genom sidan — därför
 * testade i stället för dokumenterade.
 */

const SHELL_ROUTES = ['/nyheter', '/allsvenskan/tabell', '/statistik']

test.describe('skip link (WCAG 2.4.1)', () => {
  test('finns i DOM och är dold tills den får fokus', async ({ page }) => {
    await page.goto('/nyheter')

    const skip = page.getByRole('link', { name: 'Hoppa till innehåll' })
    await expect(skip).toBeAttached()

    // Osynlig tills den fokuseras: parkerad ovanför viewporten.
    const before = await skip.boundingBox()
    expect(before, 'skip-linken ska ha en box').not.toBeNull()
    expect(before!.y).toBeLessThan(0)

    // Fokus glider in den, och den pekar på ett existerande mål.
    await skip.focus()
    await expect.poll(async () => (await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0)
    await expect(page.locator('#main')).toHaveCount(1)
  })

  // WebKit flyttar inte Tab-fokus till länkar om inte macOS "Tab highlights each
  // item" är på — tangentbordsordningen verifieras därför i Chromium.
  test('är första tabb-stoppet och flyttar fokus till #main', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit tabbar inte till länkar som standard')
    await page.goto('/nyheter')

    const skip = page.getByRole('link', { name: 'Hoppa till innehåll' })
    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  for (const route of SHELL_ROUTES) {
    test(`#main finns på ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('#main')).toHaveCount(1)
    })
  }
})

test.describe('bottendock', () => {
  test('varje flik har synlig etikett, inte bara ikon', async ({ page }) => {
    await page.goto('/nyheter')
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' })
    await expect(nav).toBeVisible()

    for (const label of ['Mitt lag', 'Flöde', 'Allsvenskan', 'Matcher', 'AI']) {
      await expect(nav.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('aktiv flik är markerad med aria-current', async ({ page }) => {
    await page.goto('/allsvenskan')
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' })
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    await expect(nav.locator('[aria-current="page"]')).toContainText('Allsvenskan')
  })

  test('docken ryms utan horisontell scroll på 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/nyheter')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    expect(overflow, 'sidan ska inte scrolla horisontellt på 320px').toBe(false)
  })
})

test.describe('träffytor (Apple HIG 44px)', () => {
  test('headerns kontroller är minst 44px höga på mobil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/nyheter')

    for (const name of ['Öppna meny', 'Sök', 'Athopia startsida']) {
      const box = await page.getByRole('link', { name }).or(page.getByRole('button', { name })).first().boundingBox()
      expect(box, `${name} ska ha en box`).not.toBeNull()
      expect(box!.height, `${name} är ${box!.height}px hög`).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('404', () => {
  test('erbjuder vägar vidare i stället för återvändsgränd', async ({ page }) => {
    const res = await page.goto('/den-har-sidan-finns-inte')
    expect(res?.status()).toBe(404)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sidan hittades inte')
    const wayfinding = page.getByRole('navigation', { name: 'Populära sidor' })
    await expect(wayfinding.getByRole('link')).toHaveCount(4)

    await wayfinding.getByRole('link', { name: /Allsvenskan/ }).click()
    await expect(page).toHaveURL(/\/allsvenskan$/)
  })
})
