"use client";

import { FormEvent, useId, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { trackEvent } from "@/lib/track";

type SubmitState = "idle" | "loading" | "pending" | "duplicate" | "error";

export function NewsletterSignupForm({
  teamSlug,
  teamName,
  authenticated = false,
  compact = false,
}: {
  teamSlug: string;
  teamName: string;
  authenticated?: boolean;
  compact?: boolean;
}) {
  const emailId = useId();
  const consentId = useId();
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<"quiet" | "standard" | "max">("standard");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    trackEvent("newsletter_signup_started", { team_slug: teamSlug });
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(!authenticated ? { email } : {}),
          teamSlug,
          cadence,
          consent,
          honeypot: String(form.get("website") ?? ""),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        state?: "pending" | "duplicate";
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Kunde inte spara din Lagbrief.");
      }
      const nextState = payload.state ?? "pending";
      setState(nextState);
      setMessage(
        nextState === "duplicate"
          ? `Du följer redan ${teamName}. Vi har markerat inställningen för synk.`
          : "Klart. Kontrollera din inkorg för att bekräfta adressen.",
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Kunde inte spara din Lagbrief.",
      );
    }
  }

  if (state === "pending" || state === "duplicate") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-foreground"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold">
              {state === "duplicate" ? "Lagbrief redan vald" : "Nästan klart"}
            </p>
            <p className="mt-1 text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "space-y-4"}>
      {!authenticated && (
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium">
            E-postadress
          </label>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="du@exempel.se"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </div>
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hur ofta?</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["quiet", "Lugnt", "Veckovis"],
            ["standard", "Standard", "Relevant"],
            ["max", "Max", "Alla lägen"],
          ].map(([value, label, detail]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-3 text-center transition-colors ${
                cadence === value
                  ? "border-pitch bg-pitch/10"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="radio"
                name="cadence"
                value={value}
                checked={cadence === value}
                onChange={() =>
                  setCadence(value as "quiet" | "standard" | "max")
                }
                className="sr-only"
              />
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {detail}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label>
          Webbplats
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3">
        <input
          id={consentId}
          type="checkbox"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border accent-[var(--color-pitch)]"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          Jag vill få Nano Fotboll Lagbrief om {teamName} via e-post och godkänner
          att Nano Fotboll behandlar min e-postadress för utskicket. Jag kan avsluta
          när som helst.
        </span>
      </label>

      {state === "error" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive-ink">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pitch px-4 text-sm font-semibold text-white transition-colors hover:bg-pitch/90 disabled:opacity-60"
      >
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "loading" ? "Sparar…" : `Få ${teamName} i inkorgen`}
      </button>
    </form>
  );
}
