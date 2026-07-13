"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Container, Label, Reveal } from "./primitives";
import { WaitlistModal } from "./WaitlistModal";
import { getTeamAccent } from "@/lib/team-colors";

/* Telefon-mockup är dekorativ (aria-hidden) och INTE LCP-elementet (det är h1
   ovan, statisk sen runda 2) — laddas som egen chunk efter hydrering av
   hero-texten så dess JS inte fördröjer FCP/TBT. Fast höjd/bredd matchar
   PhoneFrame för att undvika layout-skift när chunken landar. */
const PhoneMock = dynamic(() => import("./phone/PhoneMock"), {
  ssr: false,
  loading: () => <div aria-hidden className="h-[564px] w-[260px]" />,
});

export interface LandingHeroCopy {
  headlineAccent: string;
  body: string;
  ctaLabel?: string | null;
}

export interface HeroPulse {
  live: boolean;
  matchName: string | null;
  matchId: number | null;
  kickoff: string | null;
  leaderName: string | null;
  leaderPoints: number | null;
}

export interface ClubChip {
  slug: string;
  name: string;
  shortCode: string | null;
}

/** "Idag 15:00" / "Sön 14:00" — kompakt svensk avsparkstid. */
function kickoffLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
  if (today) return `Idag ${time}`;
  return `${d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm" })} ${time}`;
}

/** Levande sportpuls istället för statisk label — riktig data, aldrig påhittad. */
function PulseStrip({ pulse }: { pulse: HeroPulse }) {
  const hasMatch = !!pulse.matchName;
  const hasLeader = !!pulse.leaderName;
  if (!hasMatch && !hasLeader) return <Label>Allsvenskan · Live · AI-analys · Forum</Label>;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {hasMatch && (
        <Link
          href={pulse.matchId ? `/match/${pulse.matchId}` : "/match"}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/85 transition-colors hover:border-pitch/50"
        >
          {pulse.live ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-pitch" />
          )}
          <span className="font-medium">{pulse.matchName}</span>
          <span className="text-white/45">
            {pulse.live ? "LIVE" : pulse.kickoff ? kickoffLabel(pulse.kickoff) : ""}
          </span>
        </Link>
      )}
      {hasLeader && (
        <Link href="/allsvenskan/tabell" className="text-white/45 transition-colors hover:text-white/75">
          Serieledare: <span className="text-white/80">{pulse.leaderName}</span> · {pulse.leaderPoints} p
        </Link>
      )}
    </div>
  );
}

export function Hero({
  pulse,
  clubs = [],
  copy,
}: {
  pulse?: HeroPulse;
  clubs?: ClubChip[];
  copy?: LandingHeroCopy;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [modalOpen, setModalOpen] = useState(false);

  function handleCta(e: React.MouseEvent) {
    if (typeof window !== "undefined" && localStorage.getItem("athopia_access") === "1") return;
    e.preventDefault();
    setModalOpen(true);
  }
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  const headlineAccent = copy?.headlineAccent ?? "Varje dag.";
  const body =
    copy?.body ??
    "Nyheter, rykten, siffror och snack om din klubb — vi läser hundratals svenska källor varje dygn, sorterar bort bruset och sammanfattar det som betyder något. 60 sekunder om dagen, så vet du allt.";
  const ctaLabel = copy?.ctaLabel ?? "Välj din klubb — gratis";

  return (
    <section ref={ref} className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-40">
      {/* Ambient glöd */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(45,83,73,0.10) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
          {/* Copy */}
          <div className="max-w-[640px]">
            {/* LCP-element (rubrik) + intro renderas UTAN Reveal/motion —
               Reveal startar med opacity:0 + blur och väntar på JS-hydrering
               + IntersectionObserver innan paint, vilket försenade LCP till
               efter hydrering (uppmätt 9,1s). Statisk markup målas direkt. */}
            {pulse ? <PulseStrip pulse={pulse} /> : <Label>Allsvenskan · Live · AI-analys · Forum</Label>}

            <h1 className="mb-6 mt-4 font-heading text-[clamp(3.75rem,11vw,8.5rem)] leading-[0.92] tracking-wide">
              Din klubb.
              <br />
              <span className="text-pitch">{headlineAccent}</span>
            </h1>

            <p className="mb-8 max-w-[480px] text-[17px] leading-[1.65] text-white/65 md:mb-10 md:text-xl">
              {body}
            </p>

            <Reveal delay={0.24}>
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/onboarding"
                  onClick={handleCta}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-pitch px-8 text-[17px] font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                >
                  {ctaLabel} <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#upplevelsen"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 text-[17px] text-white transition-all duration-200 hover:border-white/45 active:scale-[0.97]"
                >
                  Se appen <ChevronDown className="h-4 w-4 text-white/50" />
                </a>
              </div>
            </Reveal>
            <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} redirectTo="/onboarding" />

            {clubs.length > 0 ? (
              <Reveal delay={0.32}>
                <div className="flex flex-wrap gap-2" aria-label="Välj din klubb">
                  {clubs.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/lag/${c.slug}`}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 text-[13px] font-semibold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:text-white motion-reduce:hover:translate-y-0"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: getTeamAccent(c.slug) }}
                        aria-hidden
                      />
                      {c.name}
                    </Link>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/30">Alla 16 klubbar · Gratis att börja</p>
              </Reveal>
            ) : (
              <Reveal delay={0.32}>
                <p className="text-sm text-white/30">Hela Allsvenskan · Gratis att börja</p>
              </Reveal>
            )}
          </div>

          {/* Telefon med subtil parallax */}
          <Reveal delay={0.2} className="flex justify-center lg:justify-end">
            <motion.div style={reduced ? undefined : { y: phoneY }} className="relative">
              {/* Glöd bakom telefonen */}
              <div
                aria-hidden
                className="absolute -inset-12 rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(45,83,73,0.22) 0%, transparent 65%)",
                }}
              />
              <PhoneMock />
            </motion.div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
