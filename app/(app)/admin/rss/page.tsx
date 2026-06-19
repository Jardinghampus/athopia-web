import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { currentUserIsAdmin } from "@/lib/admin";
import { RssAdminClient, type RssSource } from "./RssAdminClient";

export const metadata: Metadata = {
  title: "RSS-källor | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function getSources(): Promise<RssSource[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("rss_sources")
      .select("id, name, url, category, sport, purpose, active, error_count, last_fetched_at")
      .order("purpose", { ascending: true })
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    return (data ?? []) as RssSource[];
  } catch {
    return [];
  }
}

export default async function AdminRssPage() {
  // Försvar på djupet — proxy.ts skyddar redan /admin/*.
  if (!(await currentUserIsAdmin())) notFound();

  const sources = await getSources();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-bold text-3xl text-foreground">RSS-KÄLLOR</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lägg till och pausa flöden. Signal = nyhetskällor, Inspiration = The Athletic m.fl.
        </p>
      </div>
      <RssAdminClient initialSources={sources} />
    </div>
  );
}
