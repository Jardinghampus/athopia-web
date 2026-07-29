import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPunditIntro } from "./pundit";
import type { PersonalDaily } from "@/lib/daily/personal-daily";

function daily(sections: PersonalDaily["sections"]): PersonalDaily {
  return { minutes: 5, generatedAt: "t", sections, isEmpty: sections.length === 0 };
}
const item = (id: string, title: string) => ({ id, title, href: "/x", sourceName: null, publishedAt: "t" });

test("matchday intro references the match and top item", () => {
  const d = daily([
    { key: "dagens-match", title: "Dagens match", items: [item("m", "AIK vs DIF")] },
    { key: "mitt-lag", title: "Ditt lag", items: [item("a", "Ny tränare klar")] },
  ]);
  const s = buildPunditIntro(d, "AIK");
  assert.match(s, /Matchdag för AIK/);
  assert.match(s, /AIK vs DIF/); // on matchday the top item is the match itself
});

test("quiet day never fabricates news", () => {
  const s = buildPunditIntro(daily([]), "AIK");
  assert.match(s, /Lugnt kring AIK/);
  assert.doesNotMatch(s, /\d/); // no invented counts
});

test("normal day: count + top item, plural noun", () => {
  const d = daily([
    { key: "mitt-lag", title: "Ditt lag", items: [item("a", "Skada bekräftad"), item("b", "Andra nyheten")] },
  ]);
  const s = buildPunditIntro(d, "Hammarby");
  assert.match(s, /Sedan sist om Hammarby: 2 saker/);
  assert.match(s, /Skada bekräftad/);
});

test("singular noun for a single item", () => {
  const d = daily([{ key: "mitt-lag", title: "Ditt lag", items: [item("a", "En grej")] }]);
  assert.match(buildPunditIntro(d, "MFF"), /1 sak värda/);
});

test("falls back to 'ditt lag' without a team name", () => {
  const d = daily([{ key: "mitt-lag", title: "Ditt lag", items: [item("a", "Nyhet")] }]);
  assert.match(buildPunditIntro(d), /om ditt lag:/);
});
