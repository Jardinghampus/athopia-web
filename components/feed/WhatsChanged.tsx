import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  createSupabaseWhatsChangedAccessor,
  getWhatsChanged,
  isWhatsChangedEnabled,
} from "@/lib/feed/whats-changed";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} tim sedan`;
  return `${Math.floor(h / 24)} dagar sedan`;
}

/**
 * Slice 3 P0 — "Nytt sedan sist". Server component, only rendered when
 * `WHATS_CHANGED=true` and the visitor is signed in. Reads existing
 * `feed_open` events + `news_feed_clustered`; writes nothing.
 */
export async function WhatsChanged() {
  if (!isWhatsChangedEnabled()) return null;
  if (!isSupabaseConfigured()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  let followedTeamIds: string[] = [];
  let summary;
  try {
    const db = createServerClient();
    const { data: feedConfig } = await db
      .from("user_feed_config")
      .select("followed_team_ids")
      .eq("clerk_user_id", userId)
      .eq("sport", "football")
      .maybeSingle();
    followedTeamIds = feedConfig?.followed_team_ids ?? [];

    summary = await getWhatsChanged(
      userId,
      { followedTeamIds },
      createSupabaseWhatsChangedAccessor(db),
    );
  } catch {
    // Fail closed — never show a broken card, silently hide it instead.
    return null;
  }

  if (summary.firstVisit) {
    return (
      <div className="mb-4 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        Välkommen — här är ditt flöde.
      </div>
    );
  }

  if (summary.newCount === 0) {
    return (
      <div className="mb-4 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        Inget nytt sedan sist ({relativeTime(summary.since)}).
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <p className="text-sm font-medium text-foreground">
        Nytt sedan sist ({relativeTime(summary.since)}) · {summary.newCount}{" "}
        {summary.newCount === 1 ? "signal" : "signaler"}
      </p>
      <ul className="mt-2 space-y-1.5">
        {summary.topItems.map((item) => (
          <li key={item.id} className="truncate text-sm">
            <Link href={item.href} className="text-pitch hover:underline">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
