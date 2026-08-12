import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

// lib/funnel.ts drar in `server-only` och går inte att importera här, så
// allowlistan läses ur källkoden i stället — samma grepp som contrast-vakten.
function allowlistFromSource(): Set<string> {
  const events = new Set<string>()
  const collect = (file: string) => {
    for (const m of readFileSync(file, 'utf8').matchAll(/^\s*"([a-z0-9_]+)",\s*$/gm)) {
      events.add(m[1])
    }
  }
  collect('lib/funnel.ts')
  collect('app/api/analytics/event/route.ts')
  return events
}

/**
 * Vakt mot tyst telemetri.
 *
 * `/api/analytics/event` svarar 400 på allt som inte står i allowlistan, och
 * klienten sväljer svaret. Sex produktevents skickades därför utan att någonsin
 * loggas — bara en 400 i konsolen avslöjade det. Testet läser varje
 * `event="..."` som faktiskt skickas från koden och kräver att det är tillåtet.
 */
test('varje event som skickas finns i analytics-allowlistan', () => {
  const allowed = allowlistFromSource()

  const sent = new Map<string, string>()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules' && name !== '.next') walk(p)
        continue
      }
      if (!/\.tsx?$/.test(name)) continue
      const content = readFileSync(p, 'utf8')
      // `{ event: "..." }` är för trubbigt i sig: /api/utm/milestone använder samma
      // form med en HELT annan vokabulär (visit, activated, trial_start). Den
      // formen räknas därför bara i filer som faktiskt postar till analytics.
      const postsToAnalytics = content.includes('/api/analytics/event')
      content
        .split('\n')
        .forEach((line, i) => {
          // Två sändningsformer: <TrackedLink event="..."> i JSX och det direkta
          // trackEvent("...")-anropet. Vakten läste bara den första, så allt som
          // skickas från en handler var oskyddat — inklusive hela betal- och
          // onboardingtratten. Bara .tsx skannades också, vilket missade hooks.
          for (const re of [
            /\bevent="([a-z0-9_]+)"/,
            /\btrackEvent\(\s*"([a-z0-9_]+)"/,
            ...(postsToAnalytics ? [/\bevent:\s*"([a-z0-9_]+)"/] : []),
          ]) {
            const m = line.match(re)
            if (m && !sent.has(m[1])) sent.set(m[1], `${p}:${i + 1}`)
          }
        })
    }
  }
  for (const root of ['app', 'components', 'hooks']) walk(root)

  const missing = [...sent.entries()]
    .filter(([e]) => !allowed.has(e))
    .map(([e, where]) => `${e} (${where})`)

  expect(
    missing,
    `lägg till i PRODUCT_EVENTS i lib/funnel.ts — annars svarar API:t 400 och eventet loggas aldrig:\n${missing.join('\n')}`,
  ).toEqual([])
})

/**
 * Vakt mot att modaler tappar sin fokus-hook bakom en tidig return.
 *
 * `useModalA11y` anropades i TeamSelectionModal efter `if (!visible) return null`.
 * Antalet hooks växte alltså i samma render som modalen öppnades, React kastade
 * #310 och lagvals-onboardingen dog i det ögonblick den skulle visas — på exakt
 * de sidor den finns för.
 */
test('useModalA11y anropas aldrig efter en tidig return', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules' && name !== '.next') walk(p)
        continue
      }
      if (!/\.tsx?$/.test(name)) continue
      const lines = readFileSync(p, 'utf8').split('\n')
      // Tidig return på komponentnivå: exakt två stegs indrag, `return null`.
      const earlyReturn = lines.findIndex((l) => /^ {2}(if \(.*\) )?return null;?\s*$/.test(l))
      const hookCall = lines.findIndex((l) => /=\s*useModalA11y[<(]/.test(l))
      if (earlyReturn >= 0 && hookCall > earlyReturn) {
        offenders.push(`${p}:${hookCall + 1} (tidig return rad ${earlyReturn + 1})`)
      }
    }
  }
  for (const root of ['app', 'components']) walk(root)

  expect(
    offenders,
    `flytta useModalA11y-anropet ovanför den tidiga returen — annars kastar React #310 när modalen öppnas:\n${offenders.join('\n')}`,
  ).toEqual([])
})
