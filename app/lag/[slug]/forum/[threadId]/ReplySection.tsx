"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
}

interface Props {
  threadId: string;
  slug: string;
  locked: boolean;
  user: User | null;
}

async function postReply(threadId: string, userId: string, authorName: string, content: string) {
  const res = await fetch(`/api/forum/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, author_id: userId, author_name: authorName, content }),
  });
  if (!res.ok) throw new Error("Kunde inte posta svar");
}

export function ReplySection({ threadId, slug, locked, user }: Props) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (locked) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-border">
        Denna tråd är låst — inga fler svar kan postas.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground bg-card rounded-lg border border-border">
        <Link href="/sign-in" className="text-pitch hover:underline font-medium">
          Logga in
        </Link>{" "}
        för att svara i tråden.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 1) return;
    setError(null);
    startTransition(async () => {
      try {
        await postReply(threadId, user!.id, user!.name, content.trim());
        setContent("");
        router.refresh();
      } catch {
        setError("Något gick fel. Försök igen.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">Svara som {user.name}</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Skriv ditt svar..."
        rows={4}
        maxLength={5000}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-pitch/50 focus:border-pitch transition-colors"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">{content.length}/5000</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="submit"
            disabled={isPending || content.trim().length < 1}
            className="bg-pitch text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pitch/90 transition-colors"
          >
            {isPending ? "Postar..." : "Posta svar"}
          </button>
        </div>
      </div>
    </form>
  );
}
