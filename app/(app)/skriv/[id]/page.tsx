import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireColumnist } from "@/lib/columnist";
import { createServerClient } from "@/lib/supabase";
import { ColumnEditorClient } from "./ColumnEditorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skriv — Athopia krönikör",
  robots: { index: false, follow: false },
};

export default async function SkrivColumnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const columnist = await requireColumnist();
  if (!columnist) redirect("/");

  const db = createServerClient();
  const [{ data: column }, { data: teams }] = await Promise.all([
    db.from("columns").select("*").eq("id", id).maybeSingle(),
    db.from("entities").select("id, name").eq("type", "team").order("name"),
  ]);

  if (!column) notFound();
  if (column.author_clerk_user_id !== columnist.userId) redirect("/skriv");

  return (
    <ColumnEditorClient
      column={{
        id: column.id,
        title: column.title ?? "",
        content: column.content ?? null,
        excerpt: column.excerpt ?? "",
        status: column.status,
        teamEntityId: column.team_entity_id ?? "",
        slug: column.slug ?? null,
      }}
      teams={(teams ?? []).map((t) => ({ id: String(t.id), name: String(t.name) }))}
    />
  );
}
