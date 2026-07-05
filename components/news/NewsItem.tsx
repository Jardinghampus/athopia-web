import type { NewsSignal } from "@/lib/types";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} tim sedan`;
  return `${Math.floor(h / 24)} dagar sedan`;
}

const TIER_DOT: Record<string, string> = {
  breaking: "bg-red-500",
  major:    "bg-orange-400",
  normal:   "bg-zinc-500",
  noise:    "bg-zinc-700",
};

export function NewsItem({ item }: { item: NewsSignal }) {
  const title      = item.content?.title ?? "(ingen titel)";
  const link       = item.content?.link ?? item.source_url ?? "#";
  const pubAt      = item.content?.published_at ?? item.created_at;
  const snippet    = (item.content as { snippet?: string | null } | null)?.snippet ?? null;
  const tierColor  = TIER_DOT[item.importance_tier ?? "normal"] ?? TIER_DOT.normal;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tierColor}`} />
      <div className="min-w-0 flex-1">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-white hover:text-blue-400 transition-colors line-clamp-2"
        >
          {title}
        </a>
        {snippet && (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 line-clamp-2">{snippet}</p>
        )}
        <p className="mt-0.5 text-xs text-zinc-500">
          {item.source_name ?? "okänd källa"} · {relativeTime(pubAt)}
        </p>
      </div>
    </div>
  );
}
