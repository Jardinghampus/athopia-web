/**
 * Artikelbrödtext → säker HTML.
 *
 * Athopia-original lagras som plain text / Markdown, men /artikel renderar via
 * innerHTML. Utan den här omvandlingen kollapsar \n till mellanslag och sidan
 * blir en textklump. Inga tredjepartsbilder — luft och typografi bär layouten.
 */

export type ArticleBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] };

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-ZÅÄÖ])/;
const LONG_PARAGRAPH = 420;
const SENTENCES_PER_GRAF = 2;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Kort för kort/meta: ingen markdown, ingen HTML. */
export function plainArticleText(raw: string | null | undefined): string {
  if (!raw) return "";
  return stripTags(raw)
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-•*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseArticleBlocks(
  raw: string,
  title?: string | null,
): ArticleBlock[] {
  const prepared = prepareSource(raw);
  if (!prepared) return [];

  const hasStructure =
    /\n\n/.test(prepared) ||
    /^#{2,3}\s/m.test(prepared) ||
    /^[-•*]\s/m.test(prepared);

  const blocks = hasStructure
    ? parseStructured(prepared)
    : paragraphizeBlob(prepared).map((text) => ({ type: "p" as const, text }));

  return dropDuplicateTitle(
    blocks.flatMap(splitLongParagraph),
    title,
  );
}

export function formatArticleBodyHtml(
  raw: string | null | undefined,
  title?: string | null,
): string {
  const blocks = parseArticleBlocks(raw ?? "", title);
  if (blocks.length === 0) return "";

  let leadUsed = false;
  return blocks
    .map((block) => {
      if (block.type === "h2") {
        return `<h2>${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === "h3") {
        return `<h3>${escapeHtml(block.text)}</h3>`;
      }
      if (block.type === "ul") {
        const items = block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      const cls = !leadUsed ? ' class="lead"' : "";
      leadUsed = true;
      return `<p${cls}>${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

function prepareSource(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if (/<[a-z][\s\S]*?>/i.test(text)) {
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h[1-6]|li|div|blockquote)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "");
  }
  return decodeBasicEntities(text).replace(/\n{3,}/g, "\n\n").trim();
}

function parseStructured(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    const joined = para.join(" ").replace(/\s+/g, " ").trim();
    if (joined) blocks.push({ type: "p", text: joined });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);
    const li = trimmed.match(/^[-•*]\s+(.+)$/);
    if (h2 || h1) {
      flushPara();
      flushList();
      blocks.push({ type: "h2", text: (h2?.[1] ?? h1?.[1] ?? "").trim() });
      continue;
    }
    if (h3) {
      flushPara();
      flushList();
      blocks.push({ type: "h3", text: (h3[1] ?? "").trim() });
      continue;
    }
    if (li) {
      flushPara();
      list.push(li[1].trim());
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return blocks;
}

function splitSentences(text: string): string[] {
  const parts = text.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

function paragraphizeBlob(text: string): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= 2) return [text];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_GRAF) {
    out.push(sentences.slice(i, i + SENTENCES_PER_GRAF).join(" "));
  }
  return out;
}

function splitLongParagraph(block: ArticleBlock): ArticleBlock[] {
  if (block.type !== "p" || block.text.length < LONG_PARAGRAPH) return [block];
  return paragraphizeBlob(block.text).map((text) => ({ type: "p" as const, text }));
}

function dropDuplicateTitle(
  blocks: ArticleBlock[],
  title?: string | null,
): ArticleBlock[] {
  if (!title || blocks.length === 0) return blocks;
  const first = blocks[0];
  if (first.type === "ul") return blocks;
  const normalizedTitle = normalizeForCompare(title);
  const firstText = normalizeForCompare(first.text);
  if (firstText && firstText === normalizedTitle) return blocks.slice(1);
  return blocks;
}

function normalizeForCompare(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[.:!?]+$/g, "").trim();
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}
