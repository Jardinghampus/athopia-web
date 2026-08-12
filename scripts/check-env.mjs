#!/usr/bin/env node
/**
 * Hittar env-variabler som finns men är TOMMA i Vercel.
 *
 * Felklassen är redan dokumenterad i repots CLAUDE.md ("tom sträng i Vercel env:
 * `??` faller inte tillbaka på `""`") men ingenting letade efter den. Mätt
 * 2026-08-12 var 21 produktionsvariabler satta till tom sträng, bland dem:
 *
 *   CLERK_WEBHOOK_SECRET     → user.created verifieras aldrig, signup_complete = 0
 *   UPSTASH_REDIS_REST_URL   → rate limiting tyst ur funktion
 *   VAPID_* (fyra st)        → push kan inte fungera, push_opt_in = 0
 *   åtta feature-flaggor     → hela AI Company Program mörklagt trots "✅ satt"
 *
 * En tom variabel är värre än en saknad: koden ser att nyckeln finns, `??`
 * hoppar över defaulten, och felet blir tyst i stället för högljutt.
 *
 * Kör:  node scripts/check-env.mjs [production|preview]
 * Kräver att `vercel` CLI är inloggad. Exit 1 om något kritiskt är tomt.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ENVIRONMENT = process.argv[2] ?? 'production';

/** Fylls av Vercel vid build, inte av oss. Tomma lokalt är korrekt. */
const BUILD_TIME = /^(VERCEL_URL$|VERCEL_GIT_)/;

/**
 * Tom här betyder trasig funktion i produktion. Listan är medvetet explicit:
 * en ny hemlighet ska läggas till här samtidigt som den läggs till i Vercel,
 * annars upptäcks den saknade konfigurationen först av en användare.
 */
const CRITICAL = [
  'CLERK_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const tmp = join(tmpdir(), `athopia-env-${Date.now()}.env`);
try {
  execFileSync('npx', ['--yes', 'vercel', 'env', 'pull', tmp, `--environment=${ENVIRONMENT}`, '--yes'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
} catch (err) {
  console.error(`Kunde inte hämta env från Vercel: ${err.message}`);
  console.error('Är `vercel` inloggad? Kör `npx vercel login`.');
  process.exit(2);
}

let raw;
try {
  raw = readFileSync(tmp, 'utf8');
} finally {
  try {
    unlinkSync(tmp);
  } catch {
    /* filen kan redan vara borta */
  }
}

const empty = [];
const set = new Set();
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  const [, key, value] = m;
  set.add(key);
  const bare = value.replace(/^"|"$/g, '').trim();
  if (bare === '' && !BUILD_TIME.test(key)) empty.push(key);
}

const criticalEmpty = empty.filter((k) => CRITICAL.includes(k));
const criticalMissing = CRITICAL.filter((k) => !set.has(k));
const otherEmpty = empty.filter((k) => !CRITICAL.includes(k));

console.log(`Miljö: ${ENVIRONMENT} — ${set.size} variabler\n`);

if (criticalEmpty.length || criticalMissing.length) {
  console.log('KRITISKT — funktioner är trasiga i produktion:');
  for (const k of criticalEmpty) console.log(`  ${k}  (satt men TOM)`);
  for (const k of criticalMissing) console.log(`  ${k}  (saknas helt)`);
  console.log('');
}

if (otherEmpty.length) {
  console.log('Tomma (kontrollera om de ska ha värde — feature-flaggor räknas hit):');
  for (const k of otherEmpty) console.log(`  ${k}`);
  console.log('');
}

if (!criticalEmpty.length && !criticalMissing.length) {
  console.log('Inga kritiska variabler saknar värde.');
  process.exit(0);
}
process.exit(1);
