import { test, expect } from '@playwright/test'

const CRITICAL_PAGES = [
  { path: "/", label: "Startsida" },
  { path: "/mitt-lag", label: "Mitt lag" },
  { path: "/nyheter", label: "Flöde" },
  { path: "/forum", label: "Forum" },
  { path: "/prenumerera", label: "Prenumerera" },
  { path: "/allsvenskan", label: "Allsvenskan" },
  { path: "/sign-in", label: "Inloggning" },
]

for (const { path, label } of CRITICAL_PAGES) {
  test(`${label} (${path}) laddar utan fel`, async ({ page }) => {
    const jsErrors: string[] = []
    const resourceErrors: string[] = []
    page.on('console', msg => {
      const t = msg.text()
      if (msg.type() === 'error') {
        // Skilja resursfels-400/404 (externa API) från riktiga JS-kraschar
        if (t.includes('Failed to load resource')) resourceErrors.push(t)
        else jsErrors.push(t)
      }
    })
    page.on('pageerror', err => jsErrors.push(err.message))

    const res = await page.goto(path)
    expect(res?.status(), `HTTP status för ${path}`).toBeLessThan(500)

    // Tillåtna miljö-errors (Clerk/Stripe saknas i test-env)
    const realErrors = jsErrors.filter(e =>
      !e.includes('CLERK') &&
      !e.includes('publishableKey') &&
      !e.includes('NEXT_PUBLIC') &&
      !e.includes('supabaseUrl') &&
      !e.includes('stripe') &&
      !e.includes('Stripe')
    )

    // Logga resursfels som info (Sportmonks 400 etc) — trackas separat
    if (resourceErrors.length > 0) {
      console.warn(`  ⚠ ${path}: ${resourceErrors.length} resursfels (400/404) — se api-health.spec.ts`)
    }

    expect(realErrors, `JS-kraschfel på ${path}`).toHaveLength(0)
  })
}
