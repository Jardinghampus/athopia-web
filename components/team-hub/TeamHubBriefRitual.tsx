import Link from "next/link";
import { Sparkles } from "lucide-react";
import { canAccess, type Plan } from "@/lib/access-rules";
import type { TeamPulse } from "@/lib/team-hub/queries";

function contextLabel(label: string | null) {
  if (label === "pre_match") return "Inför match";
  if (label === "post_match_hold") return "Efter match";
  return "Dagsläge";
}

function dateLabel(value: string) {
  if (!value) return "Idag";
  return new Date(`${value}T12:00:00`).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

/** Dagens AI-brief som ritual — synlig direkt under matchdagsbannern på lag-hubben. */
export function TeamHubBriefRitual({ pulse, plan }: { pulse: TeamPulse | null; plan: Plan }) {
  if (!pulse) return null;

  const hasFull = canAccess("aiSummaries", plan);
  const ctx = contextLabel(pulse.match_context_label);

  return (
    <section
      className="mx-4 sm:mx-6 mb-5 rounded-xl border border-pitch/25 bg-gradient-to-br from-pitch/8 via-card to-card overflow-hidden"
      aria-label="Athopia idag"
    >
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-pitch" aria-hidden />
            Athopia idag · {ctx}
          </div>
          <span className="text-xs text-muted-foreground">{dateLabel(pulse.pulse_date)}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">{pulse.headline}</h2>
        {pulse.dek && (
          <p className="mt-2 text-sm font-medium text-muted-foreground">{pulse.dek}</p>
        )}

        {hasFull ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{pulse.body}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Fullständig dagens brief kräver PRO.{" "}
            <Link href="/prenumerera" className="font-medium text-pitch hover:underline">
              Uppgradera
            </Link>
          </p>
        )}

        {hasFull && pulse.match_context_label === "post_match_hold" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Matchdetaljer och spelarbetyg finns på{" "}
            <Link href="/nyheter" className="text-pitch hover:underline">
              matchsidan
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
