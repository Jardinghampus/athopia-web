import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Vakt: all svensk datum-/tidsformatering måste ange `timeZone`.
 *
 * Utan den formaterar servern i UTC (Vercel) och webbläsaren i läsarens zon.
 * Två följder, båda sedda i produktion:
 *
 * 1. `/nyheter` kraschade med React #418 — samma tidsstämpel blev olika text på
 *    server och klient. Bevisat genom att ladda sidan i tre zoner: UTC var ren,
 *    Europe/Stockholm och America/Los_Angeles kraschade.
 * 2. Serverrenderade avsparkstider låg två timmar fel på sommaren.
 *
 * Matcher spelas på svensk tid oavsett var läsaren befinner sig, så zonen är
 * en produktregel — inte något varje anropsplats får välja bort.
 */

const ROTS = ["app", "components", "lib"];
const CALL = /(new Intl\.DateTimeFormat\s*\(|\.toLocale(?:Date|Time)?String\s*\()/g;

function allaFiler(dir: string): string[] {
  const ut: string[] = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) ut.push(...allaFiler(full));
    else if (/\.tsx?$/.test(item) && !item.includes(".test.")) ut.push(full);
  }
  return ut;
}

/** Läser balanserat till matchande slutparentes — options-objekt spänner ofta flera rader. */
function argumenten(src: string, openIdx: number): string {
  let i = openIdx + 1;
  let depth = 1;
  while (i < src.length && depth > 0) {
    if ("([{".includes(src[i])) depth++;
    else if (")]}".includes(src[i])) depth--;
    i++;
  }
  return src.slice(openIdx + 1, i - 1);
}

test("ingen svensk datumformatering saknar timeZone", () => {
  const brott: string[] = [];

  for (const rot of ROTS) {
    for (const fil of allaFiler(rot)) {
      const src = readFileSync(fil, "utf8");
      let m: RegExpExecArray | null;
      CALL.lastIndex = 0;
      while ((m = CALL.exec(src))) {
        const openIdx = m.index + m[0].length - 1;
        const args = argumenten(src, openIdx);

        // Bara svensk datum-/tidsformatering. Talformatering har inga tidsfält.
        if (!/["']sv-SE["']|["']sv["']/.test(args)) continue;
        if (/FractionDigits/.test(args)) continue;
        if (args.includes("timeZone")) continue;

        const rad = src.slice(0, m.index).split("\n").length;
        brott.push(`${fil}:${rad} — ${args.replace(/\s+/g, " ").slice(0, 70)}`);
      }
    }
  }

  assert.deepEqual(
    brott,
    [],
    `Lägg till timeZone: "Europe/Stockholm":\n${brott.join("\n")}`
  );
});
