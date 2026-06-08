const { readFileSync, readdirSync, statSync, writeFileSync } = require('fs')
const { join } = require('path')

const BASE = 'C:\\Users\\jardi\\Athopia Build\\athopia-web'

function getAllFiles(dir, ext) {
  ext = ext || '.tsx'
  const files = []
  try {
    const items = readdirSync(dir)
    for (const item of items) {
      const full = join(dir, item)
      if (statSync(full).isDirectory()) {
        files.push(...getAllFiles(full, ext))
      } else if (item.endsWith(ext)) {
        files.push(full)
      }
    }
  } catch (e) {}
  return files
}

function getRoutes(appDir) {
  const routes = []
  function scan(dir, base) {
    base = base || ''
    try {
      const items = readdirSync(dir)
      for (const item of items) {
        const full = join(dir, item)
        if (statSync(full).isDirectory()) {
          const segment = item.startsWith('(') ? '' : ('/' + item)
          scan(full, base + segment)
        } else if (item === 'page.tsx') {
          routes.push(base || '/')
        }
      }
    } catch (e) {}
  }
  scan(appDir)
  return [...new Set(routes)]
}

function extractLinks(file) {
  const content = readFileSync(file, 'utf-8')
  const links = []
  // Match href="..." href='...' href={`...`} (static only)
  const re = /href=["']([^"'\n]+)["']/g
  let m
  while ((m = re.exec(content)) !== null) {
    links.push(m[1])
  }
  return links
}

const appDir = join(BASE, 'app')
const compDir = join(BASE, 'components')

console.log('Skannar routes...')
const routes = getRoutes(appDir)
console.log('Routes (' + routes.length + '):')
routes.sort().forEach(function(r) { console.log('  ' + r) })

console.log('\nAnalyserar lankar...')
const files = getAllFiles(appDir).concat(getAllFiles(compDir))
const issues = []
const allLinks = []

for (const file of files) {
  const links = extractLinks(file)
  for (const href of links) {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('/api/')) continue
    if (href.indexOf('${') !== -1) continue
    allLinks.push(href)
    const staticHref = href.split('?')[0].split('#')[0]
    const routeMatch = routes.some(function(route) {
      const pattern = route
        .replace(/\/\[\[+\.\.\.[^\]]+\]\]+/g, '(?:/.+)?')  // /[[...x]] → optional catch-all
        .replace(/\/\[+\.\.\.[^\]]+\]+/g, '/.+')            // /[...x]   → required catch-all
        .replace(/\[[^\]]+\]/g, '[^/]+')                     // [x]       → dynamic segment
      const regex = new RegExp('^' + pattern + '$')
      return regex.test(staticHref) || route === staticHref
    })
    if (!routeMatch) {
      issues.push({ file: file.replace(BASE, ''), href: href, issue: 'Route saknas' })
    }
  }
}

console.log('\nTotal lankar: ' + allLinks.length)
console.log('Brutna: ' + issues.length)

if (issues.length > 0) {
  console.log('\nBRUTNA LANKAR:')
  const grouped = {}
  for (const i of issues) {
    if (!grouped[i.href]) grouped[i.href] = []
    grouped[i.href].push(i.file)
  }
  for (const href in grouped) {
    console.log('  ' + href)
    grouped[href].forEach(function(f) { console.log('    -> ' + f) })
  }
}

const report = { timestamp: new Date().toISOString(), routes: routes, totalLinks: allLinks.length, issues: issues }
writeFileSync(join(BASE, 'scripts', 'link-audit-report.json'), JSON.stringify(report, null, 2))
console.log('\nRapport sparad: scripts/link-audit-report.json')
