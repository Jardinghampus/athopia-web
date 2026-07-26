"use client";

import { useEffect, useRef, useState } from "react";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import type { FeedModule } from "@/lib/feed/build-feed-modules";
import { queueFeedEvent } from "@/lib/feed/feed-event-client";

/** Human-readable Swedish label for a ranker factor key, e.g. "team_affinity=+12". */
function factorLabel(raw: string): string {
  const [key, value] = raw.split("=", 2);
  const n = Number(value);
  const sign = Number.isFinite(n) && n > 0 ? "+" : "";
  switch (key) {
    case "team_affinity":
      return `Du följer laget (${sign}${value})`;
    case "interest_affinity":
      return `Matchar dina intressen (${sign}${value})`;
    case "type_fatigue":
      return `Nedviktad — samma modultyp visades nyss (${value})`;
    case "freshness":
      return `Färsk (${sign}${value})`;
    case "engagement":
      return `Mycket diskussion (${sign}${value})`;
    case "kickoff_proximity":
      return `Match snart (${sign}${value})`;
    case "league_pulse":
      return `Tabellstatus (${sign}${value})`;
    case "signal_stack":
      return `Toppnyheter just nu (${sign}${value})`;
    default:
      if (key?.startsWith("type:")) return `Modultyp: ${key.slice(5)} (${value})`;
      return raw;
  }
}

/** Small overflow with feedback actions — only rendered when personalization is on + opted in. */
function ModuleFeedbackMenu({
  mod,
  onAction,
}: {
  mod: FeedModule;
  onAction: (eventType: "more_like_this" | "less_like_this" | "content_saved" | "content_hidden") => void;
}) {
  const [open, setOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  const factors = mod.tracking.factors ?? [];

  const act = (eventType: "more_like_this" | "less_like_this" | "content_saved" | "content_hidden", label: string) => {
    onAction(eventType);
    setSentFeedback(label);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Fler alternativ"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors motion-reduce:transition-none"
      >
        <span aria-hidden="true" className="text-lg leading-none">⋯</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => act("more_like_this", "Tack — visar mer sånt här")}
            className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted/60"
          >
            Mer av detta
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act("less_like_this", "Tack — visar mindre sånt här")}
            className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted/60"
          >
            Mindre av detta
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act("content_saved", "Sparat")}
            className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted/60"
          >
            Spara
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act("content_hidden", "Dold")}
            className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted/60"
          >
            Dölj
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowWhy((v) => !v);
              setOpen(true);
            }}
            className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm hover:bg-muted/60"
          >
            Varför ser jag detta?
          </button>
          {showWhy ? (
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {factors.length > 0 ? (
                <ul className="space-y-1">
                  {factors.slice(0, 6).map((f) => (
                    <li key={f}>{factorLabel(f)}</li>
                  ))}
                </ul>
              ) : (
                <p>Ingen förklaring tillgänglig för denna modul.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {sentFeedback ? (
        <span aria-live="polite" className="sr-only">
          {sentFeedback}
        </span>
      ) : null}
    </div>
  );
}

function formatKickoffShort(iso: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));
}

function moduleProps(mod: FeedModule) {
  return {
    module_id: mod.id,
    module_type: mod.type,
    reason: mod.tracking.reason,
    position: mod.tracking.position,
    ...(typeof mod.tracking.score === "number"
      ? { score: mod.tracking.score }
      : {}),
    ...(mod.tracking.factors?.length
      ? { factors: mod.tracking.factors.join("|") }
      : {}),
  };
}

function trackingFactors(factors: string[] | undefined) {
  return (factors ?? []).slice(0, 12).map((raw) => {
    const [rawKey, rawValue] = raw.split("=", 2);
    const key = (rawKey ?? "ranker_factor")
      .toLowerCase()
      .replace(/[^a-z0-9_:-]/g, "_")
      .slice(0, 64) || "ranker_factor";
    const value = Number(rawValue);
    return { key, value: Number.isFinite(value) ? Math.max(-100, Math.min(100, value)) : 1 };
  });
}

function normalizedScore(score: number | undefined): number | undefined {
  if (typeof score !== "number" || !Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(1, score / 100));
}

/**
 * Client rail for Flöde modules — impressions + opens → agent_logs (B-12).
 */
export function FeedModulesRailClient({
  modules,
  feedbackEnabled = false,
}: {
  modules: FeedModule[];
  /** Only true when FEED_RANKER_V2 is on AND the user opted into personalization. */
  feedbackEnabled?: boolean;
}) {
  const impressed = useRef(new Set<string>());

  useEffect(() => {
    for (const mod of modules) {
      if (impressed.current.has(mod.id)) continue;
      impressed.current.add(mod.id);
      void queueFeedEvent({
        eventType: "module_impression",
        surface: "club_home",
        moduleKey: mod.id,
        position: mod.tracking.position,
        score: normalizedScore(mod.tracking.score),
        rankerVersion: "v1",
        factors: trackingFactors(mod.tracking.factors),
        metadata: {},
      });
    }
  }, [modules]);

  if (modules.length === 0) return null;

  const onModuleOpen = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const wrapper = target.closest<HTMLElement>("[data-feed-module-key]");
    const moduleKey = wrapper?.dataset.feedModuleKey;
    const mod = modules.find((candidate) => candidate.id === moduleKey);
    if (!mod) return;
    void queueFeedEvent({
      eventType: "module_open",
      surface: "club_home",
      moduleKey: mod.id,
      position: mod.tracking.position,
      score: normalizedScore(mod.tracking.score),
      rankerVersion: "v1",
      factors: trackingFactors(mod.tracking.factors),
      metadata: {},
    });
  };

  const feedbackFor = (mod: FeedModule) =>
    (eventType: "more_like_this" | "less_like_this" | "content_saved" | "content_hidden") => {
      void queueFeedEvent({
        eventType,
        surface: "club_home",
        moduleKey: mod.id,
        position: mod.tracking.position,
        score: normalizedScore(mod.tracking.score),
        rankerVersion: "v1",
        factors: trackingFactors(mod.tracking.factors),
        metadata: {},
      });
    };

  return (
    <section className="mb-6 space-y-3" aria-label="Flödesmoduler" onClickCapture={onModuleOpen}>
      {modules.map((mod) => {
        const props = moduleProps(mod);
        const impression = (
          <ProductEventTracker
            key={`imp-${mod.id}`}
            event="home_module_impression"
            props={props}
            once={`home_module_impression::${mod.id}`}
            onceScope="session"
          />
        );
        const feedbackMenu = feedbackEnabled ? (
          <div className="absolute right-2 top-2 z-[1]">
            <ModuleFeedbackMenu mod={mod} onAction={feedbackFor(mod)} />
          </div>
        ) : null;

        if (mod.type === "live_match") {
          const home = String(mod.payload.homeName ?? "?");
          const away = String(mod.payload.awayName ?? "?");
          const sh = mod.payload.scoreHome;
          const sa = mod.payload.scoreAway;
          const minute = mod.payload.minute;
          const fixtureId = mod.payload.fixtureId;
          const score =
            typeof sh === "number" && typeof sa === "number"
              ? `${sh}–${sa}`
              : "–";
          const href =
            typeof fixtureId === "number" || typeof fixtureId === "string"
              ? `/match/${fixtureId}`
              : "/match";
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href={href}
                event="home_module_opened"
                props={props}
                className="block rounded-xl border border-pitch/40 bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-wide text-pitch">LIVE</p>
                  {typeof minute === "number" ? (
                    <p className="text-[11px] tabular-nums text-muted-foreground">{minute}′</p>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold text-foreground">
                  {home}{" "}
                  <span className="tabular-nums text-pitch">{score}</span>{" "}
                  {away}
                </p>
              </TrackedLink>
            </div>
          );
        }

        if (mod.type === "upcoming_matches") {
          const raw = Array.isArray(mod.payload.matches)
            ? mod.payload.matches
            : [];
          const matches = raw.slice(0, 3) as Record<string, unknown>[];
          if (matches.length === 0) return null;
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-[11px] font-bold tracking-wide text-pitch">
                  KOMMANDE
                </p>
                <ul className="mt-2 divide-y divide-border">
                  {matches.map((m) => {
                    const fixtureId = m.fixtureId;
                    const href =
                      typeof fixtureId === "number" ||
                      typeof fixtureId === "string"
                        ? `/match/${fixtureId}`
                        : "/match";
                    const home = String(m.homeName ?? "?");
                    const away = String(m.awayName ?? "?");
                    const kickoff =
                      typeof m.startingAt === "string"
                        ? formatKickoffShort(m.startingAt)
                        : null;
                    return (
                      <li key={String(fixtureId ?? `${home}-${away}`)}>
                        <TrackedLink
                          href={href}
                          event="home_module_opened"
                          props={props}
                          className="flex items-center justify-between gap-2 py-2 hover:bg-muted/40 -mx-1 px-1 rounded-md transition-colors"
                        >
                          <p className="font-semibold text-foreground text-sm line-clamp-1">
                            {home} – {away}
                          </p>
                          {kickoff ? (
                            <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {kickoff}
                            </p>
                          ) : null}
                        </TrackedLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        }

        if (mod.type === "headline_stack") {
          const raw = Array.isArray(mod.payload.headlines)
            ? mod.payload.headlines
            : [];
          const headlines = raw.slice(0, 4) as Record<string, unknown>[];
          if (headlines.length === 0) return null;
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-[11px] font-bold tracking-wide text-pitch">
                  TOPPNYHETER
                </p>
                <ul className="mt-2 divide-y divide-border">
                  {headlines.map((h) => {
                    const href = String(h.href ?? "/nyheter");
                    const title = String(h.title ?? "Nyhet");
                    const source = h.source ? String(h.source) : null;
                    return (
                      <li key={String(h.id ?? title)}>
                        <TrackedLink
                          href={href}
                          event="home_module_opened"
                          props={props}
                          className="block py-2 hover:bg-muted/40 -mx-1 px-1 rounded-md transition-colors"
                        >
                          <p className="font-semibold text-foreground line-clamp-2 text-sm">
                            {title}
                          </p>
                          {source ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {source}
                            </p>
                          ) : null}
                        </TrackedLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        }

        if (mod.type === "short_post") {
          const title = String(mod.payload.title ?? "Athopia");
          const snippet =
            typeof mod.payload.snippet === "string"
              ? mod.payload.snippet
              : null;
          const href = String(mod.payload.href ?? "/nyheter");
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href={href}
                event="home_module_opened"
                props={props}
                className="block rounded-xl border border-pitch/30 bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[11px] font-bold tracking-wide text-pitch">
                  ATHOPIA
                </p>
                <p className="mt-1 font-semibold text-foreground line-clamp-2">
                  {title}
                </p>
                {snippet ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                    {snippet}
                  </p>
                ) : null}
              </TrackedLink>
            </div>
          );
        }

        if (mod.type === "audio_briefing") {
          const title = String(mod.payload.title ?? "Athopia Daily");
          const href = String(mod.payload.href ?? "/daily");
          const access = (mod.payload.access ?? {}) as Record<string, unknown>;
          const unlocked = Boolean(access.unlocked);
          const durationSec =
            typeof mod.payload.durationSec === "number"
              ? mod.payload.durationSec
              : null;
          const mins =
            durationSec != null && durationSec > 0
              ? Math.round(durationSec / 60)
              : null;
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href={unlocked ? href : "/prenumerera"}
                event="home_module_opened"
                props={{
                  ...props,
                  unlocked: unlocked ? "1" : "0",
                }}
                className="block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-wide text-pitch">
                    DAILY
                  </p>
                  {!unlocked ? (
                    <p className="text-[11px] font-semibold text-pitch">PRO</p>
                  ) : mins != null ? (
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      ~{mins} min
                    </p>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold text-foreground line-clamp-2">
                  {title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {unlocked
                    ? "Lyssna på dagens brief"
                    : "Dagens brief — ingår i PRO"}
                </p>
              </TrackedLink>
            </div>
          );
        }

        if (mod.type === "podcast") {
          const title = String(mod.payload.title ?? "Podd");
          const show = String(mod.payload.showName ?? "Podcast");
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href="/podcast"
                event="home_module_opened"
                props={props}
                className="block rounded-xl border border-pitch/30 bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[11px] font-bold tracking-wide text-pitch">PODD</p>
                <p className="mt-1 font-semibold text-foreground line-clamp-2">{title}</p>
                <p className="mt-0.5 text-sm text-pitch">{show}</p>
              </TrackedLink>
            </div>
          );
        }

        if (mod.type === "discussion") {
          const title = String(mod.payload.title ?? "Diskussion");
          const id = String(mod.payload.id ?? "");
          const teamSlug = String(mod.payload.teamSlug ?? "");
          const href =
            id && teamSlug
              ? `/forum/${encodeURIComponent(teamSlug)}/${encodeURIComponent(id)}`
              : "/forum";
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href={href}
                event="home_module_opened"
                props={props}
                className="block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[11px] font-bold tracking-wide text-pitch">SNACKIS JUST NU</p>
                <p className="mt-1 font-semibold text-foreground line-clamp-2">{title}</p>
              </TrackedLink>
            </div>
          );
        }

        if (mod.type === "standings_snapshot") {
          const rows = Array.isArray(mod.payload.rows) ? mod.payload.rows : [];
          return (
            <div key={mod.id} data-feed-module-key={mod.id} className="relative">
              {impression}
              {feedbackMenu}
              <TrackedLink
                href="/allsvenskan"
                event="home_module_opened"
                props={props}
                className="block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-[11px] font-bold tracking-wide text-pitch">TABELL</p>
                <ul className="mt-2 space-y-1">
                  {rows.map((raw) => {
                    const r = raw as Record<string, unknown>;
                    return (
                      <li
                        key={String(r.teamSlug ?? r.teamName)}
                        className="flex justify-between text-sm tabular-nums"
                      >
                        <span>
                          {String(r.position)}. {String(r.teamName)}
                        </span>
                        <span className="text-muted-foreground">{String(r.points)} p</span>
                      </li>
                    );
                  })}
                </ul>
              </TrackedLink>
            </div>
          );
        }

        return null;
      })}
    </section>
  );
}
