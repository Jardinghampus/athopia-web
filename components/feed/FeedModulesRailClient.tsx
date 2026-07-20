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
