"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MailX } from "lucide-react";
import { NewsletterSignupForm } from "@/components/newsletter/NewsletterSignupForm";

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface PreferencesResponse {
  subscribed: boolean;
  status?: string;
  cadence?: "quiet" | "standard" | "max";
  enabled?: boolean;
  followProfileTeam?: boolean;
  team?: Team | null;
  syncStatus?: string;
}

export function NewsletterPreferencesSettings({
  profileTeamSlug,
}: {
  profileTeamSlug?: string | null;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [preferences, setPreferences] = useState<PreferencesResponse | null>(null);
  const [teamSlug, setTeamSlug] = useState(profileTeamSlug ?? "");
  const [cadence, setCadence] = useState<"quiet" | "standard" | "max">("standard");
  const [enabled, setEnabled] = useState(true);
  const [followProfileTeam, setFollowProfileTeam] = useState(true);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/newsletter/preferences").then((response) => response.json()),
      fetch("/api/team/list").then((response) => response.json()),
    ])
      .then(([preferenceData, teamData]) => {
        const next = preferenceData as PreferencesResponse;
        setPreferences(next);
        setTeams((teamData as { teams?: Team[] }).teams ?? []);
        if (next.subscribed) {
          setTeamSlug(next.team?.slug ?? profileTeamSlug ?? "");
          setCadence(next.cadence ?? "standard");
          setEnabled(next.enabled ?? true);
          setFollowProfileTeam(next.followProfileTeam ?? true);
        }
        setState("idle");
      })
      .catch(() => {
        setMessage("Kunde inte läsa Lagbrief-inställningarna.");
        setState("error");
      });
  }, [profileTeamSlug]);

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamSlug,
          cadence,
          enabled,
          followProfileTeam,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Kunde inte spara.");
      setState("saved");
      setMessage("Sparat. Ändringen väntar på synk.");
      window.setTimeout(() => setState("idle"), 2500);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Kunde inte spara.");
    }
  }

  async function unsubscribe() {
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Kunde inte avsluta Lagbrief.");
      setEnabled(false);
      setPreferences((current) =>
        current ? { ...current, status: "unsubscribed", enabled: false } : current,
      );
      setState("saved");
      setMessage("Lagbrief är avslutad och väntar på synk.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Kunde inte avsluta.");
    }
  }

  if (state === "loading") {
    return (
      <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Läser Lagbrief…
      </div>
    );
  }

  if (!preferences?.subscribed || preferences.status === "unsubscribed") {
    const selected =
      teams.find((team) => team.slug === (teamSlug || profileTeamSlug)) ?? null;
    if (!selected) {
      return (
        <p className="text-sm text-muted-foreground">
          Välj ditt lag ovan för att aktivera Lagbrief.
        </p>
      );
    }
    return (
      <NewsletterSignupForm
        teamSlug={selected.slug}
        teamName={selected.name}
        authenticated
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="newsletter-team" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Lag
        </label>
        <select
          id="newsletter-team"
          value={teamSlug}
          disabled={followProfileTeam}
          onChange={(event) => setTeamSlug(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.slug}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="newsletter-cadence" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Frekvens
        </label>
        <select
          id="newsletter-cadence"
          value={cadence}
          onChange={(event) =>
            setCadence(event.target.value as "quiet" | "standard" | "max")
          }
          className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="quiet">Lugnt – veckovis</option>
          <option value="standard">Standard – relevanta lägen</option>
          <option value="max">Max – alla godkända lägen</option>
        </select>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={followProfileTeam}
          onChange={(event) => setFollowProfileTeam(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-pitch)]"
        />
        Följ automatiskt laget i min profil
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-pitch)]"
        />
        Lagbrief är aktiv
      </label>

      {message && (
        <p
          role={state === "error" ? "alert" : "status"}
          className={
            state === "error"
              ? "text-sm text-destructive-ink"
              : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={save}
          disabled={state === "saving" || !teamSlug}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-pitch px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === "saved" ? (
            <Check className="h-4 w-4" />
          ) : null}
          Spara Lagbrief
        </button>
        <button
          type="button"
          onClick={unsubscribe}
          disabled={state === "saving" || preferences.status === "unsubscribed"}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground disabled:opacity-60"
        >
          <MailX className="h-4 w-4" />
          Avsluta
        </button>
      </div>
    </div>
  );
}
