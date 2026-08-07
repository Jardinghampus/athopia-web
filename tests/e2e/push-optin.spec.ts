import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Vakt mot att push-opt-in görs för hand.
 *
 * Onboarding hade en egen variant: den frågade `Notification.requestPermission()`
 * och POSTade sedan till `/api/push/subscribe` UTAN body. Endpointen kräver
 * `{ subscription: { endpoint, keys } }` och svarade alltid fel, så ingen
 * prenumeration skapades någonsin. Användaren fick ändå "Aktiverade ✓" och
 * sedan aldrig en enda notis — ett tyst fel som bara syntes i nätverksfliken.
 *
 * Hela flödet (behörighet → serviceWorker.ready → pushManager.subscribe →
 * POST med body → push_opt_in-event) finns i `usePushPermission` i
 * hooks/usePwa.ts. Det är den enda vägen som får finnas.
 */

function walk(dir: string, hit: (path: string, source: string) => void) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'node_modules' && name !== '.next') walk(p, hit)
      continue
    }
    if (!/\.tsx?$/.test(name)) continue
    hit(p, readFileSync(p, 'utf8'))
  }
}

test('push-behörighet begärs bara via usePushPermission', () => {
  const offenders: string[] = []
  for (const root of ['app', 'components', 'hooks']) {
    walk(root, (p, source) => {
      if (p.endsWith(join('hooks', 'usePwa.ts'))) return
      source.split('\n').forEach((line, i) => {
        if (/Notification\.requestPermission\s*\(/.test(line)) {
          offenders.push(`${p}:${i + 1}`)
        }
      })
    })
  }

  expect(
    offenders,
    `använd usePushPermission() från hooks/usePwa.ts — en egen variant missar\n` +
      `pushManager.subscribe och skapar ingen prenumeration:\n${offenders.join('\n')}`,
  ).toEqual([])
})

test('/api/push/subscribe anropas alltid med en subscription i bodyn', () => {
  const offenders: string[] = []
  for (const root of ['app', 'components', 'hooks']) {
    walk(root, (p, source) => {
      // Titta på hela anropet, inte en rad i taget — fetch-anropet är flerradigt.
      for (const m of source.matchAll(/fetch\(\s*["'`]\/api\/push\/subscribe["'`][\s\S]{0,300}?\)/g)) {
        if (!/body\s*:/.test(m[0])) {
          const line = source.slice(0, m.index ?? 0).split('\n').length
          offenders.push(`${p}:${line}`)
        }
      }
    })
  }

  expect(
    offenders,
    `endpointen kräver { subscription: { endpoint, keys } } — utan body svarar\n` +
      `den alltid fel och ingen notis skickas någonsin:\n${offenders.join('\n')}`,
  ).toEqual([])
})
