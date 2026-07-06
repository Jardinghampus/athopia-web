function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-pitch hover:underline">$1</a>');
  return out;
}

function parseTable(lines: string[]): string {
  if (lines.length < 2) return `<p>${escapeHtml(lines.join("\n"))}</p>`;
  const rows = lines.map((l) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
  );
  const header = rows[0];
  const body = rows.slice(2);
  const th = header.map((c) => `<th class="px-3 py-2 text-left text-xs font-semibold">${inlineFormat(c)}</th>`).join("");
  const trs = body
    .map(
      (r) =>
        `<tr class="border-t border-border/60">${r
          .map((c) => `<td class="px-3 py-2 text-sm text-muted-foreground">${inlineFormat(c)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<div class="overflow-x-auto my-4 rounded-lg border border-border"><table class="w-full text-sm"><thead class="bg-muted/30"><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

export function MarkdownDoc({ source }: { source: string }) {
  const html = markdownToHtml(source);
  return (
    <article
      className="prose prose-invert prose-sm max-w-none space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_code]:rounded [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_li]:my-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      parts.push(
        `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code.join("\n"))}</code></pre>`
      );
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      parts.push(parseTable(tableLines));
      continue;
    }

    if (line.startsWith("# ")) {
      parts.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      parts.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      parts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      i++;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^[-*] /, ""))}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    parts.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return parts.join("\n");
}
