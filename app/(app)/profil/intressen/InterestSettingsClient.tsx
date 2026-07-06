"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { INTEREST_OPTIONS } from "@/lib/feed/interest-options";

export function InterestSettingsClient({ initialSelected }: { initialSelected: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/feed/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_types: selected }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map(({ id, label }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
                active
                  ? "border-pitch bg-pitch/15 text-foreground"
                  : "border-border text-muted-foreground hover:border-pitch/40"
              }`}
            >
              {active && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Sparar…
            </span>
          ) : (
            "Spara intressen"
          )}
        </button>
        {saved && <span className="text-sm text-pitch">Sparat ✓</span>}
        <Link href="/profil" className="text-sm text-muted-foreground hover:text-foreground">
          Tillbaka till profil
        </Link>
      </div>
    </div>
  );
}
