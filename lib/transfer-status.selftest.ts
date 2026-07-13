/**
 * Lightweight assert-tests for transfer-status (no vitest in web package).
 * Run: npx tsx lib/transfer-status.selftest.ts
 */
import { resolveTransferStatus } from "./transfer-status";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const multi = resolveTransferStatus({ sourceCount: 2, title: "X till Y", sourceName: "Sportbladet" });
assert(multi.status === "bekraftad" && multi.reason === "multi_source", "multi-source should confirm");

const club = resolveTransferStatus({ sourceCount: 1, title: "Ny back klar", sourceName: "AIK Fotboll" });
assert(club.status === "bekraftad" && club.reason === "official_source", "club source should confirm");

const title = resolveTransferStatus({ sourceCount: 1, title: "Officiellt: spelare klar", sourceName: "Bloggen" });
assert(title.status === "bekraftad" && title.reason === "confirmed_title", "title should confirm");

const rumor = resolveTransferStatus({ sourceCount: 1, title: "Kan vara på väg", sourceName: "Twitter-konto" });
assert(rumor.status === "rykte" && rumor.label === "Rykte", "single non-official should be rykte");

const dups = resolveTransferStatus({
  sourceCount: 1,
  duplicateSources: ["Aftonbladet", "Expressen"],
  title: "Rykte",
  sourceName: "X",
});
assert(dups.status === "bekraftad", "duplicate_sources should raise source count");

console.log("transfer-status.selftest: ok");
