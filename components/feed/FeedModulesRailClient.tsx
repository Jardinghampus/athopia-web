"use client";

import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import type { FeedModule } from "@/lib/feed/build-feed-modules";

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

/**
 * Client rail for Flöde modules — impressions + opens → agent_logs (B-12).
 */
export function FeedModulesRailClient({ modules }: { modules: FeedModule[] }) {
  if (modules.length === 0) return null;

  return (
    <section className="mb-6 space-y-3" aria-label="Flödesmoduler">
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
            <div key={mod.id}>
              {impression}
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

        if (mod.type === "headline_stack") {
          const raw = Array.isArray(mod.payload.headlines)
            ? mod.payload.headlines
            : [];
          const headlines = raw.slice(0, 4) as Record<string, unknown>[];
          if (headlines.length === 0) return null;
          return (
            <div key={mod.id}>
              {impression}
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
            <div key={mod.id}>
              {impression}
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
            <div key={mod.id}>
              {impression}
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
            <div key={mod.id}>
              {impression}
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
            <div key={mod.id}>
              {impression}
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
            <div key={mod.id}>
              {impression}
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
