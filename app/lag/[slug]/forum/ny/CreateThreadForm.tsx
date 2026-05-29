"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  teamId: string;
  authorId: string;
  authorName: string;
}

async function createThread(payload: {
  team_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
}): Promise<{ id: string }> {
  const res = await fetch("/api/forum/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Kunde inte skapa tråd");
  }
  return res.json() as Promise<{ id: string }>;
}

export function CreateThreadForm({ slug, teamId, authorId, authorName }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (!teamId) {
      setError("Laget kunde inte hittas. Prova igen.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createThread({
          team_id: teamId,
          title: title.trim(),
          content: content.trim(),
          author_id: authorId,
          author_name: authorName,
        });
        router.push(`/lag/${slug}/forum/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Något gick fel. Försök igen.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1.5">
          Rubrik
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Vad handlar tråden om?"
          maxLength={200}
          required
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pitch/50 focus:border-pitch transition-colors"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{title.length}/200</p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1.5">
          Innehåll
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Beskriv din tanke eller fråga..."
          rows={8}
          maxLength={10000}
          required
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-pitch/50 focus:border-pitch transition-colors"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{content.length}/10000</p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">Postar som {authorName}</p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="submit"
            disabled={isPending || !title.trim() || !content.trim()}
            className="bg-pitch text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pitch/90 transition-colors"
          >
            {isPending ? "Skapar..." : "Skapa tråd"}
          </button>
        </div>
      </div>
    </form>
  );
}
