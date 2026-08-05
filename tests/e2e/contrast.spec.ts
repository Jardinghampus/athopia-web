import { test, expect } from '@playwright/test'

/**
 * WCAG 1.4.3 (kontrast, AA) mätt mot verklig DOM i båda teman.
 *
 * Mäter beräknad textfärg mot den effektiva bakgrunden och kräver 4.5:1
 * (3:1 för stor text). Vid start: ~90 brott, främst för svag --muted-foreground
 * och accentfärgen använd som text på mörkt tema. Se UX-AUDIT-2026-08-03.md.
 *
 * Medvetet konservativ: element vars bakgrund inte går att bestämma säkert
 * (gradient, bild, oklab-färg i kedjan) hoppas över hellre än rapporteras som
 * brott — falska fynd är dyrare än missade.
 */
const ROUTES = [
  '/nyheter', '/allsvenskan/tabell', '/prenumerera', '/mer', '/statistik', '/forum',
  // Andra vändan: ytorna som första svepet aldrig rörde.
  '/', '/allsvenskan', '/match', '/mitt-lag', '/daily', '/podcast', '/analys',
  '/allsvenskan/spelschema', '/allsvenskan/skytteliga', '/statistik/spelare',
  '/om-oss', '/ai-transparens',
]

/**
 * Vakt mot att accentfärgen åter används som textfärg. `text-pitch` och
 * `text-pitch-light` är fasta hex som inte växlar med temat och ger 2.0–2.8:1.
 * Använd `text-pitch-ink`. Ytor (`bg-pitch`, `border-pitch`) är fortsatt rätt.
 */
test('accentfärgen används inte som statisk textfärg', async () => {
  const { readdirSync, readFileSync, statSync } = await import('fs')
  const { join } = await import('path')

  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules' && name !== '.next') walk(p)
        continue
      }
      if (!/\.tsx?$/.test(name)) continue
      readFileSync(p, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/text-pitch(?![-\w/])|text-pitch-light\b/.test(line)) {
            offenders.push(`${p}:${i + 1}`)
          }
        })
    }
  }
  for (const root of ['app', 'components']) walk(root)

  expect(offenders, `använd text-pitch-ink i stället:\n${offenders.join('\n')}`).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`contrast ${theme} ${route}`, async ({ page }) => {
      // next-themes styr temat via .dark-klassen + localStorage, inte via
      // prefers-color-scheme — emulateMedia ensamt ger en inkonsekvent DOM.
      await page.emulateMedia({ colorScheme: theme })
      await page.addInitScript((t) => {
        localStorage.setItem('theme', t)
      }, theme)
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1800)

      // Vänta på att temats VARIABLER faktiskt gäller, inte bara att .dark-
      // klassen satts. WebKit hinner rendera ett mellanläge med mörk bakgrund
      // och ljusa texttokens — det ser ut som ~90 kontrastbrott och är bara
      // en flash. Mätning i det läget är värdelös.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const cs = getComputedStyle(document.documentElement)
              // Gate på den FAKTISKT målade bakgrunden, inte bara på klassen
              // eller --foreground. Under temaflashen hinner de gå isär: html
              // får .dark och mörk textfärg medan bakgrunden ännu är ljus, och
              // mätning i det läget ger ~90 falska brott.
              const bg = getComputedStyle(document.body).backgroundColor
              return `${document.documentElement.classList.contains('dark')}|${bg}|${cs
                .getPropertyValue('--background')
                .trim()
                .toLowerCase()}`
            }),
          { timeout: 15000 },
        )
        .toBe(
          theme === 'dark'
            ? 'true|rgb(0, 0, 0)|#000'
            : 'false|rgb(250, 250, 248)|#fafaf8',
        )

      const rows = await page.evaluate(() => {
        const lum = (c: number[]) => {
          const [r, g, b] = c.map((v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const parse = (s: string): number[] | null => {
          const m = s.match(/rgba?\(([^)]+)\)/)
          if (!m) return null
          const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
          if (p.length >= 4 && p[3] === 0) return null
          return [p[0], p[1], p[2]]
        }
        // Effektiv bakgrund: gå uppåt tills en icke-transparent hittas.
        // null = obestämbar (gradient/bild i vägen) → mät inte, hellre missa ett
        // fynd än rapportera brus.
        const bgOf = (el: Element): number[] | null => {
          let n: Element | null = el
          while (n) {
            const s = getComputedStyle(n)
            if (s.backgroundImage && s.backgroundImage !== 'none') return null
            const raw = s.backgroundColor
            const c = parse(raw)
            if (c) return c
            // Genomskinlig → fortsätt uppåt. Men Tailwind v4 skriver
            // opacitetsmodifierade färger som oklab()/oklch(), som parsern inte
            // förstår — de är ogenomskinliga och får aldrig hoppas över.
            const transparent = /^rgba?\(/.test(raw) || raw === 'transparent'
            if (!transparent) return null
            n = n.parentElement
          }
          return [255, 255, 255]
        }
        const ratio = (a: number[], b: number[]) => {
          const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
          return (l1 + 0.05) / (l2 + 0.05)
        }

        const out: any[] = []
        const seen = new Set<string>()
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const text = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent || '')
            .join('')
            .trim()
          if (!text) continue
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue
          if (s.opacity === '0') continue

          const fg = parse(s.color)
          if (!fg) continue
          const bg = bgOf(el)
          if (!bg) continue
          const cr = ratio(fg, bg)

          const px = parseFloat(s.fontSize)
          const bold = parseInt(s.fontWeight, 10) >= 700
          const large = px >= 24 || (px >= 18.66 && bold)
          const need = large ? 3 : 4.5
          if (cr >= need) continue

          const key = `${s.color}|${s.fontSize}|${text.slice(0, 20)}`
          if (seen.has(key)) continue
          seen.add(key)

          out.push({
            text: text.slice(0, 40),
            color: s.color,
            bg: `rgb(${bg.join(',')})`,
            px: Math.round(px),
            weight: s.fontWeight,
            ratio: Math.round(cr * 100) / 100,
            need,
            cls: (el.getAttribute('class') || '').slice(0, 70),
          })
        }
        return out
      })

      const report = rows
        .map((r) => `  ${r.ratio}:1 (kräver ${r.need}) ${r.px}px w${r.weight} ${r.color} på ${r.bg} — ${JSON.stringify(r.text)}`)
        .join('\n')
      expect(rows, `kontrastbrott i ${theme} på ${route}:\n${report}`).toEqual([])
    })
  }
}
