import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireColumnist } from "@/lib/columnist";
import { createServerClient } from "@/lib/supabase";
import { ColumnistDashboardClient, type ColumnListItem } from "./ColumnistDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skriv — Athopia krönikör",
  robots: { index: false, follow: false },
};

export default async function SkrivPage() {
  const columnist = await requireColumnist();
  if (!columnist) redirect("/");

  const db = createServerClient();
  const { data } = await db
    .from("columns")
    .select("id, title, status, updated_at, published_at")
    .eq("author_clerk_user_id", columnist.userId)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dina krönikor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Skriv, redigera och publicera — endast synligt för dig tills du publicerar.</p>
        </div>
      </div>
      <ColumnistDashboardClient columns={(data ?? []) as ColumnListItem[]} />
    </div>
  );
}
