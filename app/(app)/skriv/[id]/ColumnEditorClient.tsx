"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { RichTextEditor } from "@/components/columnist/RichTextEditor";

interface ColumnData {
  id: string;
  title: string;
  content: JSONContent | null;
  excerpt: string;
  status: "draft" | "pending_review" | "published";
  teamEntityId: string;
  slug: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function ColumnEditorClient({ column, teams }: { column: ColumnData; teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(column.title);
  const [excerpt, setExcerpt] = useState(column.excerpt);
  const [teamEntityId, setTeamEntityId] = useState(column.teamEntityId);
  const [status, setStatus] = useState(column.status);
  const [slug, setSlug] = useState(column.slug);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const pending = useRef<{ content?: JSONContent; content_html?: string }>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/columns/${column.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.slug) setSlug(data.slug);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [column.id]
  );

  // Debounerad autosave av brödtext — sparar 1.2s efter senaste tangenttryck.
  const handleEditorChange = useCallback(
    (json: JSONContent, html: string) => {
      pending.current = { content: json, content_html: html };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void save(pending.current);
      }, 1200);
    },
    [save]
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function saveMeta() {
    void save({ title, excerpt, team_entity_id: teamEntityId || null });
  }

  async function publish() {
    setPublishing(true);
    // Se till att senaste brödtext-ändringen hunnit sparas innan publicering.
    if (saveTimer.current) { clearTimeout(saveTimer.current); await save(pending.current); }
    await save({ title, excerpt, team_entity_id: teamEntityId || null, status: "published" });
    setStatus("published");
    setPublishing(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <SaveIndicator state={saveState} />
        {status === "published" && slug ? (
          <a href={`/kronika/${slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-pitch hover:underline">
            Se publicerad <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Utkast — bara du ser detta</span>
        )}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveMeta}
        placeholder="Rubrik"
        className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={teamEntityId}
          onChange={(e) => { setTeamEntityId(e.target.value); void save({ team_entity_id: e.target.value || null }); }}
          className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300"
        >
          <option value="">Ingen lagtaggning</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          onBlur={saveMeta}
          placeholder="Kort ingress (visas i listor, valfritt)"
          maxLength={300}
          className="h-9 flex-1 min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
        />
      </div>

      <RichTextEditor content={column.content} onChange={handleEditorChange} />

      <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-5">
        <p className="text-xs text-muted-foreground">
          {status === "published" ? "Publicerad — ändringar sparas direkt till den publika sidan." : "Endast synlig för dig tills du publicerar."}
        </p>
        {status !== "published" && (
          <button
            onClick={publish}
            disabled={publishing || !title.trim()}
            className="flex items-center gap-2 rounded-xl pitch-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
            Publicera
          </button>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return <span />;
  if (state === "saving") return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Sparar…</span>;
  if (state === "error") return <span className="text-xs text-red-400">Kunde inte spara — försök igen</span>;
  return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3 w-3 text-pitch" />Sparat</span>;
}
