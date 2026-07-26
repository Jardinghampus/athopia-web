import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Radio, MessageSquare } from "lucide-react";
import { isMinMatchdagEnabled } from "@/lib/matchday/isMinMatchdagEnabled";
import { matchdayPhase } from "@/lib/matchday/matchdayPhase";
import { getFavoriteTeamMatchToday } from "@/lib/matchday/getFavoriteTeamMatchToday";
import { formatKickoff } from "@/lib/matchday/helpers";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Min matchdag | Athopia",
    description: "Din matchdagsresa för favoritlaget — uppladdning, live, analys och diskussion, samlat på ett ställe.",
  };
}

export default async function MinMatchdagPage() {
  if (!isMinMatchdagEnabled()) notFound();

  const data = await getFavoriteTeamMatchToday();
  const phase = matchdayPhase(data?.match ?? null, new Date());

  if (phase === "none" || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Ingen match för ditt lag idag</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Vi hittade ingen match idag för ditt valda favoritlag. Kolla spelschemat eller
          välj ett lag att följa.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/mitt-lag"
            className="rounded-full bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch/90"
          >
            Välj favoritlag
          </Link>
          <Link
            href="/match"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Se spelschema
          </Link>
        </div>
      </div>
    );
  }

  const { teamName, match } = data;
  const score =
    match.home_score != null && match.away_score != null
      ? `${match.home_score}–${match.away_score}`
      : null;
  const matchHref = `/match/${match.sportmonks_id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Min matchdag · {teamName}
        </h1>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {match.home_team_name} {score ?? "vs"} {match.away_team_name}
        </p>
      </header>

      {phase === "pre" && (
        <section className="rounded-xl border border-border bg-card p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="size-3" />
            Avspark {formatKickoff(match.kickoff_at)}
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Matchen har inte börjat än. Följ formkurva, tabelläge och senaste nytt inför
            avspark.
          </p>
          <Link
            href={matchHref}
            className="mt-4 inline-block rounded-full bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch/90"
          >
            Inför matchen →
          </Link>
        </section>
      )}

      {phase === "live" && (
        <section className="rounded-xl border border-border bg-card p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
            <Radio className="size-3 animate-pulse" />
            Live
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Matchen pågår. Följ ställning, händelser och statistik i realtid.
          </p>
          <Link
            href={matchHref}
            className="mt-4 inline-block rounded-full bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch/90"
          >
            Följ {teamName} live →
          </Link>
        </section>
      )}

      {phase === "post" && (
        <section className="rounded-xl border border-border bg-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Slutresultat
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Matchen är slut. Se AI-analys, spelarbetyg och xG mot resultat.
          </p>
          <Link
            href={matchHref}
            className="mt-4 inline-block rounded-full bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch/90"
          >
            Se statistik & analys →
          </Link>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Diskutera matchen</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Prata match med andra {teamName}-supportrar.
        </p>
        <Link
          href={matchHref}
          className="mt-3 inline-block text-sm font-medium text-pitch hover:underline"
        >
          Till forumet →
        </Link>
      </section>
    </div>
  );
}
