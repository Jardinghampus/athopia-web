"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";

export interface ColumnListItem {
  id: string;
  title: string;
  status: "draft" | "pending_review" | "published";
  updated_at: string;
  published_at: string | null;
}

const STATUS_LABEL: Record<ColumnListItem["status"], string> = {
  draft: "Utkast",
  pending_review: "Under granskning",
  published: "Publicerad",
};

export function ColumnistDashboardClient({ columns }: { columns: ColumnListItem[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createDraft() {
    setCreating(true);
    try {
      const res = await fetch("/api/columns", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error();
      const { id } = await res.json();
      router.push(`/skriv/${id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={createDraft}
        disabled={creating}
        className="flex w-full items-center justify-center gap-2 rounded-xl pitch-gradient px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ny krönika
      </button>

      {columns.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Inga krönikor ännu — tryck på knappen ovan för att börja skriva.</p>
      ) : (
        <ListGroup>
          {columns.map((c) => (
            <ListRow
              key={c.id}
              href={`/skriv/${c.id}`}
              title={c.title || "Namnlöst utkast"}
              subtitle={STATUS_LABEL[c.status]}
              trailing={
                c.status === "published" ? (
                  <span className="text-xs font-semibold text-pitch">Live</span>
                ) : undefined
              }
            />
          ))}
        </ListGroup>
      )}

      <Link href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
        ← Tillbaka till Athopia
      </Link>
    </div>
  );
}
