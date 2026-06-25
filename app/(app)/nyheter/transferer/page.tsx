import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Allsvenskan Transfernyheter 2026 – Värvningar & Avslut",
  description: "Senaste transfernyheter från Allsvenskan 2026. Värvningar, avslutade affärer och rykten.",
  alternates: { canonical: "https://athopia.se/nyheter/transferer" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/nyheter/transferer",
    title: "Allsvenskan Transfernyheter 2026 – Värvningar & Avslut",
    description: "Värvningar, avslut och ryktesläget i Allsvenskan 2026.",
  },
};

async function getTransferArticles() {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data } = await db
      .from("articles")
      .select("id,slug,title,summary,source_name,published_at,image_url")
      .eq("status", "published")
      .or("title.ilike.%transfer%,title.ilike.%värvning%,title.ilike.%klar för%,title.ilike.%lämnar%,title.ilike.%ansluter%")
      .order("published_at", { ascending: false })
      .limit(40);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function TransfernyhetPage() {
  const articles = await getTransferArticles();

  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-5xl mx-auto">
      <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
        <Link href="/nyheter" className="hover:text-foreground">Nyheter</Link>
        <span>›</span>
        <span className="text-foreground">Transferer</span>
      </nav>

      <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-2">ALLSVENSKAN TRANSFERNYHETER 2026</h1>
      <p className="text-muted-foreground mb-8">Värvningar, avslutade affärer och rykten från Allsvenskan.</p>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">Inga transfernyheter just nu — kolla tillbaka snart.</p>
      ) : (
        <div className="space-y-2">
          {articles.map((a: Record<string, unknown>) => (
            <Link
              key={String(a.id)}
              href={`/artikel/${String(a.slug)}`}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 hover:border-pitch/50 transition-colors"
            >
              <span className="font-medium text-foreground leading-snug">{String(a.title)}</span>
              <span className="text-xs text-muted-foreground">
                {String(a.source_name ?? "Athopia")} · {a.published_at ? new Date(String(a.published_at)).toLocaleDateString("sv-SE") : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
