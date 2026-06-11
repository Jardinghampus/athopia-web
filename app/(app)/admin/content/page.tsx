import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { currentUserIsAdmin } from "@/lib/admin";
import type { Article } from "@/lib/types";
import { ContentReviewClient } from "./ContentReviewClient";

export const metadata: Metadata = {
  title: "Content-granskning | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ALLSVENSKAN_TEAMS = [
  { name: "AIK", slug: "aik" },
  { name: "Djurgårdens IF", slug: "djurgardens-if" },
  { name: "Malmö FF", slug: "malmoe-ff" },
  { name: "Helsingborgs IF", slug: "helsingborgs-if" },
  { name: "IFK Göteborg", slug: "ifk-goeteborg" },
  { name: "BK Häcken", slug: "bk-haecken" },
  { name: "Hammarby IF", slug: "hammarby-if" },
  { name: "IK Sirius", slug: "ik-sirius" },
  { name: "Kalmar FF", slug: "kalmar-ff" },
  { name: "IF Elfsborg", slug: "if-elfsborg" },
  { name: "Örebro SK", slug: "orebro-sk" },
  { name: "IFK Norrköping", slug: "ifk-norrkoping" },
  { name: "GIF Sundsvall", slug: "gif-sundsvall" },
  { name: "Mjällby AIF", slug: "mjallby-aif" },
  { name: "IK Värnamo", slug: "ik-varnamo" },
  { name: "Halmstads BK", slug: "halmstads-bk" },
];

async function getPendingArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "pending_review")
      .order("published_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

export default async function AdminContentPage() {
  // Försvar på djupet — middleware skyddar redan /admin/*, men dölj sidan
  // helt (404) om en icke-admin på något sätt når hit.
  if (!(await currentUserIsAdmin())) notFound();

  const articles = await getPendingArticles();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-foreground">CONTENT-GRANSKNING</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {articles.length} artiklar väntar på granskning
        </p>
      </div>
      <ContentReviewClient articles={articles} teams={ALLSVENSKAN_TEAMS} />
    </div>
  );
}
