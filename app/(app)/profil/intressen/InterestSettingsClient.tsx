"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { INTEREST_OPTIONS } from "@/lib/feed/interest-options";
import { setFeedPersonalizationConsent } from "@/lib/feed/feed-event-client";

export function InterestSettingsClient({
  initialSelected,
  initialPersonalizationEnabled,
}: {
  initialSelected: string[];
  initialPersonalizationEnabled: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(
    initialPersonalizationEnabled,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSaved(false);
    setError(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(false);
    try {
      const res = await fetch("/api/feed/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_types: selected,
          personalization_enabled: personalizationEnabled,
        }),
      });
      if (res.ok) {
        setFeedPersonalizationConsent(personalizationEnabled);
        setSaved(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
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

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Personligt Club Home
            </h2>
            <p id="personalization-description" className="mt-1 text-sm text-muted-foreground">
              Låt Athopia lära sig av vilka moduler, filter och artiklar du använder.
              Stänger du av funktionen raderas den sparade interaktionshistoriken.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={personalizationEnabled}
            aria-describedby="personalization-description"
            onClick={() => {
              setPersonalizationEnabled((enabled) => !enabled);
              setSaved(false);
              setError(false);
            }}
            className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
              personalizationEnabled ? "bg-pitch" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                personalizationEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
            <span className="sr-only">
              {personalizationEnabled ? "Stäng av personalisering" : "Slå på personalisering"}
            </span>
          </button>
        </div>
      </section>

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
            "Spara inställningar"
          )}
        </button>
        {saved && <span className="text-sm text-pitch">Sparat ✓</span>}
        {error && (
          <span role="alert" className="text-sm text-destructive">
            Kunde inte spara. Försök igen.
          </span>
        )}
        <Link href="/profil" className="text-sm text-muted-foreground hover:text-foreground">
          Tillbaka till profil
        </Link>
      </div>
    </div>
  );
}
