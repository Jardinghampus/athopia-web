"use client";

/**
 * WaitlistForm — e-post + lag + samtycke.
 *
 * Lagen kommer som prop från servern (entities), inte från en hårdkodad lista.
 * Honeypot-fältet är dolt för människor men syns för bottar; ifyllt fält får
 * samma svar som en lyckad registrering.
 */

import { useState, type FormEvent } from "react";
import type { WaitlistTeam } from "@/lib/waitlist/teams";

interface Props {
  teams: WaitlistTeam[];
  /** Vidarebefordras till API:t så referral kan knytas. */
  referral?: string | undefined;
}

type State = "idle" | "sending" | "done" | "error";

export function WaitlistForm({ teams, referral }: Props) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const consent = data.get("consent") === "on";

    if (!consent) {
      setState("error");
      setMessage("Du behöver godkänna att vi mejlar dig.");
      return;
    }

    setState("sending");
    setMessage("");

    const params = new URLSearchParams(window.location.search);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? "").trim(),
          favorite_team: String(data.get("favorite_team") ?? ""),
          consent: true,
          honeypot: String(data.get("company") ?? ""),
          ref: referral ?? null,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState("error");
        setMessage(body.error ?? "Något gick fel. Försök igen.");
        return;
      }

      setState("done");
    } catch {
      setState("error");
      setMessage("Något gick fel. Försök igen.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-lg font-medium">Kolla mejlet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vi har skickat en bekräftelselänk. Den gäller i 48 timmar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="waitlist-email" className="mb-1.5 block text-sm font-medium">
          E-post
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="du@exempel.se"
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-pitch"
        />
      </div>

      <div>
        <label htmlFor="waitlist-team" className="mb-1.5 block text-sm font-medium">
          Ditt lag
        </label>
        <select
          id="waitlist-team"
          name="favorite_team"
          required
          defaultValue=""
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-pitch"
        >
          <option value="" disabled>
            Välj klubb
          </option>
          {teams.map((team) => (
            <option key={team.slug} value={team.slug}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Botfälla. Dold för skärmläsare och tangentbord, inte för bottar. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="waitlist-company">Företag</label>
        <input id="waitlist-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 size-4 rounded border-border accent-pitch"
        />
        <span className="text-muted-foreground">Jag vill ha mejl när Athopia öppnar.</span>
      </label>

      {state === "error" && message && (
        <p role="alert" className="text-sm text-destructive-ink">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-md bg-pitch px-4 py-2.5 font-medium text-white transition-opacity disabled:opacity-60"
      >
        {state === "sending" ? "Skickar…" : "Håll platsen"}
      </button>
    </form>
  );
}
