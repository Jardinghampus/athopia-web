/**
 * app/mitt-lag/page.tsx — Inloggad startsida (brief-ritual)
 * ─────────────────────────────────────────────────────────────────────────────
 * Brief-first hem för inloggade: dagens AI-brief + matchdag + snabblänkar.
 * Full lag-hub finns på /lag/{slug}.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Star, ArrowRight, Newspaper, BarChart3 } from "lucide-react";
import { getPrimaryTeam } from "@/lib/team/getPrimaryTeam";
import { getTeamHub } from "@/lib/team-hub/queries";
import { getUserPlan } from "@/lib/user-plan";
import { TeamHubBriefRitual } from "@/components/team-hub/TeamHubBriefRitual";
import { MatchdayBanner } from "@/components/team-hub/MatchdayBanner";
import { FeedMatchHero } from "@/components/feed/FeedMatchHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hem — Athopia idag",
  description: "Din dagliga brief, matchdag och snabbvägar till laget.",
};

/** Svensk hälsning efter Stockholm-tid + förnamn när det finns. */
function homeGreeting(firstName: string | null | undefined): string {
  const hour = Number(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const name = firstName?.trim().split(/\s+/)[0] || null;

  let phrase: string;
  if (hour >= 5 && hour < 11) phrase = "God morgon";
  else if (hour >= 11 && hour < 17) phrase = "Välkommen tillbaka";
  else if (hour >= 17 && hour < 22) phrase = "God kväll";
  else phrase = "Välkommen";

  return name ? `${phrase}, ${name}` : phrase;
}

export default async function MittLagPage({
  searchParams,
}: {
  searchParams: Promise<{ hub?: string; tab?: string }>;
}) {
  const [primaryTeam, sp, user] = await Promise.all([
    getPrimaryTeam(),
    searchParams,
    currentUser(),
  ]);

  if (primaryTeam?.slug && sp.hub === "1") {
    const tab = typeof sp.tab === "string" ? sp.tab : undefined;
    const qs = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    redirect(`/lag/${primaryTeam.slug}${qs}`);
  }

  if (!primaryTeam?.slug) {
    // Inloggad som aldrig slutfört onboarding → wizard. Den som aktivt hoppade
    // över lagval (onboardingDone i Clerk-metadata) eller gäst får pickern.
    const meta = user?.unsafeMetadata as Record<string, unknown> | undefined;
    if (user && !meta?.["favoriteTeam"] && meta?.["onboardingDone"] !== true) {
      redirect("/onboarding");
    }
    return <EmptyPicker />;
  }

  const [plan, hub] = await Promise.all([
    getUserPlan(),
    getTeamHub(primaryTeam.slug),
  ]);

  if (!hub) {
    return <EmptyPicker />;
  }

  const greeting = homeGreeting(user?.firstName);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 pt-4">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Athopia · {hub.team.name}
          </p>
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1"
            style={{ fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}
          >
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Det här behöver du veta om {hub.team.name} idag.
          </p>
        </div>
        <Link
          href={`/lag/${hub.team.slug}?tab=oversikt`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-pitch/40 transition-colors"
        >
          Hela hubben
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <TeamHubBriefRitual pulse={hub.pulse} dailyEpisode={hub.dailyEpisode} plan={plan} />

      <div className="mb-5">
        <MatchdayBanner
          teamName={hub.team.name}
          recent={hub.recent}
          upcoming={hub.upcoming}
        />
      </div>

      <FeedMatchHero />

      <nav className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Snabbvägar">
        <QuickLink
          href={`/lag/${hub.team.slug}?tab=oversikt`}
          icon={BarChart3}
          title="Laghub"
          desc="Statistik, trupp och form"
        />
        <QuickLink
          href={`/nyheter?lag=${encodeURIComponent(hub.team.name)}`}
          icon={Newspaper}
          title="Nyheter"
          desc="Senaste om laget"
        />
        <QuickLink
          href="/feed"
          icon={Newspaper}
          title="Ditt flöde"
          desc="Personaliserade headlines"
        />
        <QuickLink
          href={`/forum/${hub.team.slug}`}
          icon={Star}
          title="Forum"
          desc="Diskutera med supportrar"
        />
      </nav>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Star;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-pitch/40 transition-colors"
    >
      <Icon className="h-5 w-5 text-pitch mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-pitch">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function EmptyPicker() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-pitch/10 border border-pitch/30 flex items-center justify-center mx-auto">
        <Star className="h-7 w-7 text-pitch" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mitt lag</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Välj favoritlag för att få dagens brief och matchdag här.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/allsvenskan"
          className="rounded-lg bg-pitch text-white text-sm font-medium px-4 py-2.5 hover:bg-pitch/90 transition-colors"
        >
          Bläddra bland lag
        </Link>
        <Link
          href="/onboarding"
          className="rounded-lg border border-border text-sm text-muted-foreground px-4 py-2.5 hover:text-foreground transition-colors"
        >
          Välj favoritlag
        </Link>
      </div>
    </div>
  );
}
