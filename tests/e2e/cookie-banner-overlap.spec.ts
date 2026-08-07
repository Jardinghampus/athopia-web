import { test, expect } from '@playwright/test'

/**
 * Vakt mot att cookie-bannern blockerar navigationen.
 *
 * Bannern ligger i rot-layouten på z-[9999] och visas så fort samtycke saknas —
 * alltså för varje ny besökare. På `bottom-4` låg den rakt över hela GlassNav:
 * alla fem flikarna var 100 % täckta och gick inte att klicka, trots att bannern
 * är `aria-modal="false"` och alltså inte ska spärra sidan. Samma sak hände
 * onboardingens primärknapp.
 *
 * Bannern positioneras nu mot `--dock-inset`, som GlassNav publicerar.
 */

const ROUTES = ['/nyheter', '/allsvenskan', '/mitt-lag']

for (const route of ROUTES) {
  test(`cookie-bannern täcker inte bottennavigationen på ${route}`, async ({ browser }) => {
    // Färsk kontext = inget sparat samtycke, dvs. exakt en ny besökare.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto(route, { waitUntil: 'networkidle' })

    const banner = page.locator('[aria-label="Cookie-inställningar"]')
    await expect(banner, 'bannern ska visas utan tidigare samtycke').toBeVisible()

    const overlap = await page.evaluate(() => {
      const b = document.querySelector('[aria-label="Cookie-inställningar"]')!.getBoundingClientRect()
      const nav = document.querySelector('nav[aria-label="Huvudnavigation"]')
      if (!nav) return null
      const n = nav.getBoundingClientRect()
      const w = Math.max(0, Math.min(b.right, n.right) - Math.max(b.left, n.left))
      const h = Math.max(0, Math.min(b.bottom, n.bottom) - Math.max(b.top, n.top))
      return (w * h) / (n.width * n.height)
    })

    expect(overlap, 'GlassNav ska finnas på sidan').not.toBeNull()
    expect(
      overlap,
      'bannern överlappar bottennavigationen — nya besökare kan inte navigera',
    ).toBe(0)

    // Bevisa att flikarna faktiskt går att träffa, inte bara att de syns.
    await page.getByRole('link', { name: 'Allsvenskan' }).first().click({ timeout: 5000 })
    await expect(page).toHaveURL(/\/allsvenskan/)

    await ctx.close()
  })
}
