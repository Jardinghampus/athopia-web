import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { jsonLd } from '../../lib/json-ld'

/**
 * JSON-LD-injektion. `JSON.stringify()` escapar inte `<`, så ett fält som
 * innehåller `</script>` bryter sig ut ur strukturerad-data-taggen. Titlar
 * kommer från RSS-källor och AI-pipelinen — de är inte vår text.
 */

test('jsonLd stänger ute </script>', () => {
  const out = jsonLd({ headline: 'Mål! </script><script>alert(1)</script>' })
  expect(out).not.toContain('</script>')
  expect(out).not.toContain('<')
  // Fortfarande giltig JSON med oförändrat innehåll för en JSON-LD-parser.
  expect(JSON.parse(out)).toEqual({ headline: 'Mål! </script><script>alert(1)</script>' })
})

test('jsonLd escapar radseparatorer', () => {
  const out = jsonLd({ t: `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c` })
  expect(out).not.toMatch(new RegExp(`[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`))
  expect(JSON.parse(out)).toEqual({ t: `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c` })
})

test('inget strukturerad-data-block använder rå JSON.stringify', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules' && name !== '.next') walk(p)
        continue
      }
      if (!/\.tsx?$/.test(name)) continue
      const src = readFileSync(p, 'utf8')
      if (!src.includes('application/ld+json')) continue
      // Leta efter JSON.stringify i samma fil som ett ld+json-block.
      src.split('\n').forEach((line, i) => {
        if (line.includes('JSON.stringify') && line.includes('__html')) {
          offenders.push(`${p}:${i + 1}`)
        }
      })
    }
  }
  walk('app')

  expect(
    offenders,
    `använd jsonLd() från @/lib/json-ld i stället:\n${offenders.join('\n')}`,
  ).toEqual([])
})
