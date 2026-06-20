"use client";

import {
  Bell,
  MessageCircle,
  Activity,
  Sparkles,
  Brain,
  Radar,
} from "lucide-react";
import { Container, Label, Display, Reveal, Section } from "./primitives";

/* Bento-grid: varje kort har en egen mini-visual byggd i Tailwind —
   ingen kortstil upprepas rakt av. */

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group h-full rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-pitch/25 hover:bg-pitch/[0.03] active:scale-[0.99] md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-pitch/15 bg-pitch/10">
        <Icon className="h-5 w-5 text-pitch" />
      </div>
      <h3 className="font-sans text-[17px] font-bold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/50">{text}</p>
    </div>
  );
}

export function BentoFeatures() {
  return (
    <Section id="funktioner">
      <Container>
        <div className="mb-12 md:mb-20">
          <Reveal>
            <Label>Funktioner</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <Display size="lg" className="mt-4 max-w-[680px]">
              Allt om Allsvenskan.
              <br />
              Ingenting du inte bett om.
            </Display>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Signalstyrt flöde — bred */}
          <Reveal className="sm:col-span-2">
            <CardShell>
              <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
                <CardHead
                  icon={Radar}
                  title="Signalstyrt nyhetsflöde"
                  text="Varje nyhet får en signal-score baserad på antal oberoende källor, vikt och färskhet. Bruset filtreras bort — det viktiga hamnar överst."
                />
                <div className="flex w-full shrink-0 flex-col gap-2 md:w-[240px]">
                  {[
                    { score: "0.94", tier: "BREAKING", w: "94%" },
                    { score: "0.71", tier: "MAJOR", w: "71%" },
                    { score: "0.32", tier: "NORMAL", w: "32%" },
                  ].map(({ score, tier, w }) => (
                    <div
                      key={tier}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-white/70">{score}</span>
                        <span className="text-pitch">{tier}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-pitch" style={{ width: w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardShell>
          </Reveal>

          {/* 2. AI-sammanfattningar */}
          <Reveal delay={0.06}>
            <CardShell>
              <CardHead
                icon={Sparkles}
                title="AI-sammanfattningar"
                text="Hela omgången för ditt lag — sammanfattad på 30 sekunder, av AI som läst alla källor åt dig."
              />
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="h-2 w-[85%] rounded bg-white/[0.1]" />
                <div className="mt-2 h-2 w-[65%] rounded bg-white/[0.07]" />
                <div className="mt-2 h-2 w-[75%] rounded bg-white/[0.05]" />
                <span className="mt-3 inline-block rounded-full bg-pitch/15 px-2.5 py-1 text-[10px] font-bold text-pitch">
                  Sammanfatta omgång 15
                </span>
              </div>
            </CardShell>
          </Reveal>

          {/* 3. Live & matchstatistik */}
          <Reveal delay={0.06}>
            <CardShell>
              <CardHead
                icon={Activity}
                title="Live-resultat & statistik"
                text="Mål, minuter, skott och matchhändelser i realtid — direkt i flödet, utan att byta flik."
              />
              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <span className="text-sm font-bold text-white/80">AIK</span>
                <div className="text-center">
                  <span className="font-heading text-2xl tracking-wider text-white">2–1</span>
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                    <span className="live-dot !h-1.5 !w-1.5" />
                    73&prime;
                  </span>
                </div>
                <span className="text-sm font-bold text-white/80">HIF</span>
              </div>
            </CardShell>
          </Reveal>

          {/* 4. Push */}
          <Reveal delay={0.12}>
            <CardShell>
              <CardHead
                icon={Bell}
                title="Push när det smäller"
                text="Mål, bekräftade transfers, skador i ditt lag. Inget annat — du bestämmer tröskeln."
              />
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.05] p-3 backdrop-blur">
                <div className="pitch-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-heading text-sm text-white">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Mål! Guidetti 2–1 (71&prime;)</p>
                  <p className="mt-0.5 text-[10px] text-white/40">Athopia · nu</p>
                </div>
              </div>
            </CardShell>
          </Reveal>

          {/* 5. Forum */}
          <Reveal delay={0.12}>
            <CardShell>
              <CardHead
                icon={MessageCircle}
                title="Ditt lags forum"
                text="Diskutera med fans som bryr sig lika mycket som du — inte med hela internet."
              />
              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="flex -space-x-2">
                  {["bg-pitch", "bg-sky-600", "bg-amber-500", "bg-rose-500"].map((tone) => (
                    <div key={tone} className={`h-7 w-7 rounded-full ring-2 ring-[#101211] ${tone}`} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-white/50">+87 fans online</span>
              </div>
            </CardShell>
          </Reveal>

          {/* 6. Fotbolls-IQ — bred */}
          <Reveal delay={0.18} className="sm:col-span-2">
            <CardShell>
              <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
                <CardHead
                  icon={Brain}
                  title="Fotbolls-IQ"
                  text="Din kunskapsrating stiger när du läser, tippar och följer matcherna. Tävla i ligan mot fans av samma lag — fotboll som gör dig bättre på fotboll."
                />
                <div className="flex shrink-0 items-center gap-5 md:pr-4">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" stroke="var(--color-pitch)" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset="53.4"
                      />
                    </svg>
                    <span className="font-heading text-xl tracking-wider text-white">1340</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-pitch">+12 denna omgång</p>
                    <p className="mt-0.5 text-xs text-white/40">Plats 3 av 87 i AIK-ligan</p>
                  </div>
                </div>
              </div>
            </CardShell>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
