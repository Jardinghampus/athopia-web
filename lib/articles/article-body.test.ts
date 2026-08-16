import assert from "node:assert/strict";
import test from "node:test";
import {
  escapeHtml,
  formatArticleBodyHtml,
  parseArticleBlocks,
  plainArticleText,
} from "./article-body";

test("plain text med tomrader blir stycken, första är lead", () => {
  const html = formatArticleBodyHtml(
    "Sirius vann med 4-1.\n\nIFK Göteborg har nu tre raka förluster.",
  );
  assert.match(html, /<p class="lead">Sirius vann med 4-1\.<\/p>/);
  assert.match(html, /<p>IFK Göteborg har nu tre raka förluster\.<\/p>/);
});

test("markdown-mellanrubriker blir h2, inte h1", () => {
  const html = formatArticleBodyHtml(
    "## 4-1 i Uppsala\n\nSirius var det klart vassare laget.\n\n## Vad Göteborg bär med sig\n\nFormen är bruten.",
  );
  assert.match(html, /<h2>4-1 i Uppsala<\/h2>/);
  assert.match(html, /<h2>Vad Göteborg bär med sig<\/h2>/);
  assert.doesNotMatch(html, /<h1/);
});

test("punktlistor blir ul", () => {
  const html = formatArticleBodyHtml(
    "Läget inför avspark\n\n- Hegland missar.\n- Bergvall startar.",
  );
  assert.match(html, /<ul><li>Hegland missar\.<\/li><li>Bergvall startar\.<\/li><\/ul>/);
});

test("textklump utan radbrytning styckas i korta graf", () => {
  const blob =
    "Häcken och AIK gjorde upp om en poäng. Det slutade 0-0 efter en match utan risk. " +
    "Samma sak i Bromma där Hammarby fick 1-1. Sirius sänkte IFK Göteborg med 4-1 hemma.";
  const blocks = parseArticleBlocks(blob);
  assert.ok(blocks.length >= 2);
  assert.equal(blocks.every((b) => b.type === "p"), true);
});

test("HTML från modellen escapas, script körs inte", () => {
  const html = formatArticleBodyHtml(
    'Hej <script>alert(1)</script> och <img src=x onerror=alert(1)>.',
  );
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /onerror/);
  assert.match(html, /Hej alert\(1\) och/);
});

test("första raden som duplicerar titeln slängs", () => {
  const html = formatArticleBodyHtml(
    "Örgryte förlorar efter självmål\n\nBP utnyttjade misstaget.",
    "Örgryte förlorar efter självmål",
  );
  assert.doesNotMatch(html, /Örgryte förlorar efter självmål/);
  assert.match(html, /BP utnyttjade misstaget/);
});

test("plainArticleText tar bort markdown för kort", () => {
  assert.equal(
    plainArticleText("## Rubrik\n\n- punkt\n\nBröd."),
    "Rubrik punkt Bröd.",
  );
});

test("escapeHtml säkrar attribut", () => {
  assert.equal(escapeHtml('<a href="x">'), "&lt;a href=&quot;x&quot;&gt;");
});
