"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

type PostLabel = 'transfer' | 'taktik' | 'match' | 'rykte' | 'diskussion';

const LABELS: { id: PostLabel; emoji: string; text: string }[] = [
  { id: "diskussion", emoji: "💬", text: "Diskussion" },
  { id: "match",      emoji: "⚽", text: "Match" },
  { id: "transfer",   emoji: "✍️", text: "Transfer" },
  { id: "taktik",     emoji: "🧠", text: "Taktik" },
  { id: "rykte",      emoji: "🔥", text: "Rykte" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  parentId?: string;
  rootId?: string;
  teamSlug: string;
  sport?: string;
  onPost: (post: {
    content: string;
    label?: PostLabel;
    parentId?: string;
    rootId?: string;
    teamSlug: string;
    sport: string;
  }) => Promise<void>;
  placeholder?: string;
  showLabel?: boolean;
}

export default function ComposePost({
  parentId,
  rootId,
  teamSlug,
  sport = "football",
  onPost,
  placeholder = "Vad tänker du?",
  showLabel = !parentId, // only show label picker for root posts
}: Props) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [label, setLabel] = useState<PostLabel | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const name = user.fullName ?? user.username ?? "Anonym";
  const max = 500;
  const remaining = max - content.length;

  async function handlePost() {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onPost({ content: content.trim(), label, parentId, rootId, teamSlug, sport });
      setContent("");
      setLabel(undefined);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-pitch flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt="" width={36} height={36} className="rounded-full object-cover" />
        ) : (
          initials(name)
        )}
      </div>
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, max))}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none border-b border-border/40 pb-2 focus:border-pitch/60 transition-colors"
        />

        {/* Label picker — only for root posts */}
        {showLabel && (
          <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
            {LABELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLabel(label === l.id ? undefined : l.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all touch-manipulation ${
                  label === l.id
                    ? "bg-pitch/15 border-pitch/60 text-pitch"
                    : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>{l.emoji}</span>
                {l.text}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              remaining < 50
                ? remaining < 10
                  ? "text-destructive"
                  : "text-amber-500"
                : "text-muted-foreground"
            }`}
          >
            {remaining}
          </span>
          <button
            onClick={handlePost}
            disabled={!content.trim() || loading}
            className="px-4 py-1.5 rounded-full bg-pitch text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pitch/90 transition-colors"
          >
            {loading ? "Postar…" : "Posta"}
          </button>
        </div>
      </div>
    </div>
  );
}
