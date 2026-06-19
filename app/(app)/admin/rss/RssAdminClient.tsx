"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: "news" | "club" | "league" | "podcast";
  sport: "football" | "golf";
  purpose: "signal" | "inspiration";
  active: boolean;
  error_count: number;
  last_fetched_at: string | null;
}

const CATEGORIES = ["news", "club", "league", "podcast"] as const;

export function RssAdminClient({ initialSources }: { initialSources: RssSource[] }) {
  const [sources, setSources] = useState<RssSource[]>(initialSources);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    category: "news" as RssSource["category"],
    sport: "football" as RssSource["sport"],
    purpose: "signal" as RssSource["purpose"],
  });

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("Namn och URL krävs");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rss", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Fel");
      setSources((prev) => {
        const without = prev.filter((s) => s.id !== json.source.id);
        return [...without, json.source as RssSource];
      });
      setForm({ ...form, name: "", url: "" });
      toast.success(`La till ${json.source.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte lägga till");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(src: RssSource) {
    const next = !src.active;
    setSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, active: next } : s)));
    try {
      const res = await fetch("/api/admin/rss", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: src.id, active: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? `Aktiverade ${src.name}` : `Pausade ${src.name}`);
    } catch {
      // Rulla tillbaka vid fel
      setSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, active: src.active } : s)));
      toast.error("Kunde inte uppdatera");
    }
  }

  const groups: { key: string; label: string; items: RssSource[] }[] = [
    {
      key: "inspiration",
      label: "Inspiration (The Athletic m.fl.)",
      items: sources.filter((s) => s.purpose === "inspiration"),
    },
    {
      key: "football",
      label: "Fotboll – signal",
      items: sources.filter((s) => s.purpose === "signal" && s.sport === "football"),
    },
    {
      key: "golf",
      label: "Golf – signal",
      items: sources.filter((s) => s.purpose === "signal" && s.sport === "golf"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Lägg till-formulär */}
      <form onSubmit={addSource} className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-lg">Lägg till källa</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Namn (t.ex. The Athletic)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="RSS-URL (https://…)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value as RssSource["purpose"] })}
          >
            <option value="signal">Signal (nyhetskälla)</option>
            <option value="inspiration">Inspiration</option>
          </select>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.sport}
            onChange={(e) => setForm({ ...form, sport: e.target.value as RssSource["sport"] })}
          >
            <option value="football">Fotboll</option>
            <option value="golf">Golf</option>
          </select>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as RssSource["category"] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Sparar…" : "Lägg till"}
        </button>
      </form>

      {/* Grupperade listor */}
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="font-semibold text-lg mb-2">
            {g.label} <span className="text-muted-foreground text-sm">({g.items.length})</span>
          </h2>
          <div className="rounded-xl border border-border divide-y divide-border">
            {g.items.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Inga källor.</p>
            )}
            {g.items.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{s.name}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {s.category}
                    </span>
                    {s.error_count > 0 && (
                      <span className="text-[10px] text-red-500">{s.error_count} fel</span>
                    )}
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground truncate block hover:underline"
                  >
                    {s.url}
                  </a>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    s.active
                      ? "bg-green-500/15 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.active ? "Aktiv" : "Pausad"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
