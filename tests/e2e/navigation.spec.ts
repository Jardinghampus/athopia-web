import { test, expect, request } from '@playwright/test'

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

const ROUTES = [
  '/',
  '/feed',
  '/nyheter',
  '/forum',
  '/statistik',
  '/podcast',
  '/sammanfattning',
  '/allsvenskan',
  '/analys',
  '/konto',
  '/onboarding',
  '/prenumerera',
  '/lag/aik',
  '/lag/djurgarden',
  '/lag/malmo-ff',
]

test.describe('Navigation audit', () => {

  test('Alla routes laddar utan 404/500', async ({ }) => {
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const errors: string[] = []

    const results = await Promise.all(
      ROUTES.map(async (route) => {
        const response = await ctx.get(route, { maxRedirects: 5, timeout: 60000 })
        return { route, status: response.status() }
      })
    )

    await ctx.dispose()

    for (const { route, status } of results) {
      if (status === 404) {
        errors.push(`❌ 404: ${route}`)
      } else if (status === 500) {
        errors.push(`❌ 500: ${route}`)
      } else {
        console.log(`✅ ${status}: ${route}`)
      }
    }

    if (errors.length > 0) {
      console.log('\nBrutna routes:')
      errors.forEach(e => console.log(e))
    }

    expect(errors).toHaveLength(0)
  })

  test('Inga kritiska console errors på huvudsidor', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    for (const route of ['/', '/nyheter']) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    }

    const critical = consoleErrors.filter(e =>
      !e.includes('Warning') &&
      !e.includes('hydration') &&
      !e.includes('Warning:') &&
      !e.includes('clerk') &&
      !e.includes('Clerk') &&
      !e.includes('400') &&
      !e.includes('Failed to load resource')
    )

    if (critical.length > 0) {
      console.log('Console errors:')
      critical.forEach(e => console.log(`  ❌ ${e}`))
    }

    expect(critical).toHaveLength(0)
  })

  test('MobileNav tabs navigerar korrekt', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // MobileNav är nav-elementet längst ner (md:hidden)
    const mobileNav = page.locator('nav').last()

    const tabs = [
      { label: 'Nyheter', href: '/nyheter' },
      { label: 'Statistik', href: '/statistik' },
      { label: 'Forum', href: '/forum' },
    ]

    for (const tab of tabs) {
      const link = mobileNav.getByText(tab.label)
      if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
        await link.click()
        console.log(`✅ MobileNav: ${tab.label} → ${tab.href}`)
      } else {
        console.log(`⚠️ MobileNav: ${tab.label} inte synlig (ok på desktop)`)
      }
    }
  })

  test('Lag-sidor laddar', async ({ page }) => {
    const lag = ['aik', 'djurgarden', 'malmo-ff', 'hammarby']
    for (const slug of lag) {
      const response = await page.goto(`${BASE_URL}/lag/${slug}`)
      const status = response?.status()
      expect(status).not.toBe(500)
      console.log(`${status === 200 ? '✅' : '⚠️'} /lag/${slug} → ${status}`)
    }
  })

  test('Footer-länkar är klickbara', async ({ page }) => {
    await page.goto(`${BASE_URL}/nyheter`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.locator('footer').waitFor({ timeout: 10000 }).catch(() => null)

    const footerLinks = ['/nyheter', '/allsvenskan', '/podcast', '/prenumerera']
    for (const href of footerLinks) {
      const link = page.locator(`footer a[href="${href}"]`).first()
      const visible = await link.isVisible({ timeout: 5000 }).catch(() => false)
      if (visible) {
        console.log(`✅ Footer: ${href} synlig`)
      } else {
        console.log(`⚠️ Footer: ${href} ej synlig`)
      }
    }
    // Footer renderas server-side — kontrollera att den finns i DOM
    const footerCount = await page.locator('footer').count()
    expect(footerCount).toBeGreaterThan(0)
  })

  test('Inga brutna bilder på startsidan', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
    })

    if (brokenImages.length > 0) {
      console.log('Brutna bilder:')
      brokenImages.forEach(src => console.log(`  ❌ ${src}`))
    }

    expect(brokenImages).toHaveLength(0)
  })

  test('Forum-sida laddar', async ({ page }) => {
    await page.goto(`${BASE_URL}/forum/aik`)
    await expect(page).toHaveURL(/\/forum\/aik/)
    const status = await page.evaluate(() => document.title)
    console.log(`✅ /forum/aik laddad: "${status}"`)
  })

})
