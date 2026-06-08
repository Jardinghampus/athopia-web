"use client";

import { useRef, ReactNode } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  Newspaper,
  BarChart3,
  Bell,
  Target,
  BookOpen,
  Users,
  Star,
  MapPin,
  ArrowRight,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`max-w-[1200px] mx-auto px-6 md:px-16 ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-pitch text-[11px] font-bold tracking-[0.18em] uppercase font-sans">
      {children}
    </span>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AthopiaLanding() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen font-sans overflow-x-hidden">
      <SiteNav />
      <Hero />
      <Pain />
      <ValueProp />
      <HowItWorks />
      <Testimonials />
      <ForWhom />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}

// ── 1. NAV ────────────────────────────────────────────────────────────────────

function SiteNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <Container>
        <nav className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-heading text-2xl tracking-widest text-white hover:text-pitch transition-colors duration-200"
          >
            ATHOPIA
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {["Allsvenskan", "Fotboll", "Om oss"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-sm text-white/55 hover:text-white transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/konto"
              className="hidden md:inline-flex text-sm text-white/60 hover:text-white border border-white/15 hover:border-white/35 rounded-lg px-4 py-2 transition-all duration-200"
            >
              Logga in
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-pitch text-black rounded-lg px-4 py-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              Börja gratis
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}

// ── 2. HERO ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-36 pb-[120px] overflow-hidden">
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(29,158,117,0.10) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="max-w-[800px]">
          <Reveal>
            <Label>Svensk fotbollsjournalistik — uppgraderad</Label>
          </Reveal>

          <Reveal delay={0.08}>
            <h1
              className="font-heading leading-[0.92] tracking-wide mt-5 mb-6"
              style={{ fontSize: "clamp(4.5rem, 11vw, 9rem)" }}
            >
              Fotboll som
              <br />
              <span className="text-pitch">känns på riktigt.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-white/65 text-lg md:text-xl leading-relaxed max-w-[540px] mb-10">
              Athopia är plattformen för dig som vill mer än en tabell och tre
              rader fakta. Djupanalys. Matchkänsla. Allsvenskan — läst som det
              förtjänar.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-pitch text-black font-bold rounded-xl px-7 py-3.5 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 text-base"
              >
                Läs dagens analys <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center justify-center border border-white/20 text-white rounded-xl px-7 py-3.5 hover:border-white/45 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base">
                Se hur det fungerar
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <p className="text-white/30 text-sm">
              Läst av 12 000+ Allsvenskan-fans varje omgång
            </p>
          </Reveal>
        </div>

        {/* Editorial article mockup */}
        <Reveal delay={0.14} className="mt-20">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] max-w-[900px] aspect-[16/8]">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #0d1d16 0%, #0a0a0a 60%, #080f0c 100%)",
              }}
            />

            <div className="absolute inset-0 flex flex-col p-8 md:p-12">
              {/* Article meta row */}
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-pitch/20 text-pitch text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase">
                  Matchanalys
                </span>
                <span className="text-white/25 text-xs">
                  Omgång 15 · AIK vs Hammarby · 2–1
                </span>
                <span className="ml-auto text-white/20 text-xs hidden sm:block">
                  8 min läsning
                </span>
              </div>

              {/* Headline skeletons */}
              <div className="h-7 md:h-9 bg-white/[0.08] rounded-lg w-[75%] mb-3" />
              <div className="h-5 bg-white/[0.05] rounded w-[50%] mb-8" />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { key: "xG", val: "1.82" },
                  { key: "Possession", val: "54%" },
                  { key: "PPDA", val: "7.2" },
                ].map(({ key, val }) => (
                  <div
                    key={key}
                    className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]"
                  >
                    <div className="text-pitch font-heading text-2xl md:text-3xl leading-none">
                      {val}
                    </div>
                    <div className="text-white/35 text-[10px] mt-1.5 uppercase tracking-widest">
                      {key}
                    </div>
                  </div>
                ))}
              </div>

              {/* Body skeletons */}
              <div className="flex flex-col gap-2">
                {[100, 88, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 bg-white/[0.04] rounded"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom vignette */}
            <div
              aria-hidden
              className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to top, #0A0A0A 0%, transparent 100%)" }}
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

// ── 3. PAIN ───────────────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: Newspaper,
    label: "Rubrikjournalistik",
    quote: '"AIK förlängde sitt kontrakt."',
    text: "Okej. Men varför? Vad betyder det? Du vet inte mer nu än innan.",
  },
  {
    icon: BarChart3,
    label: "Siffror utan sammanhang",
    quote: "xG, pressintensitet, passningslinjer —",
    text: "data du inte kan göra något med för att ingen förklarar den.",
  },
  {
    icon: Bell,
    label: "Brus utan substans",
    quote: "Transferrykten. Clickbait. Twitter-threads.",
    text: "Fem källor som säger exakt samma sak med fem olika rubriker.",
  },
];

function Pain() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <Reveal>
          <Label>Varför Athopia finns</Label>
        </Reveal>

        <Reveal delay={0.08}>
          <h2
            className="font-heading leading-none tracking-wide mt-5 mb-16 max-w-[680px]"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
          >
            Fotbollsnyheterna
            <br />
            du läser räcker
            <br />
            inte längre.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {painPoints.map(({ icon: Icon, label, quote, text }, i) => (
            <Reveal key={label} delay={0.08 + i * 0.1}>
              <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 h-full hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-pitch/10 border border-pitch/15 flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-pitch" />
                </div>
                <h3 className="font-sans font-semibold text-white text-lg mb-3">{label}</h3>
                <p className="text-white/45 text-sm italic mb-2">{quote}</p>
                <p className="text-white/55 text-sm leading-relaxed">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── 4. VALUE PROPOSITION ──────────────────────────────────────────────────────

const features = [
  {
    label: "MATCHANALYS",
    title: "Varje match berättad på djupet",
    text: "Taktik, vändpunkter, spelarroller. Inte bara resultat — utan varför det blev som det blev.",
  },
  {
    label: "ALLSVENSKAN IQ",
    title: "Bli skarpare för varje omgång",
    text: "Din personliga kunskapsrating stiger när du läser, tippar och följer matcherna. Fotboll som gör dig bättre på fotboll.",
  },
  {
    label: "LIGAVÄNNEN",
    title: "Tävla mot fans av samma lag",
    text: "Inte mot hela Sverige. Mot 87 andra AIK-fans som bryr sig lika mycket som du.",
  },
  {
    label: "SÄSONGSNARRATIV",
    title: "Hela säsongen som en berättelse",
    text: "Varje omgång hänger ihop. Vi hjälper dig se säsongen som helhet — inte bara den senaste matchen.",
  },
];

function ValueProp() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div>
            <Reveal>
              <Label>Vad du får</Label>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                className="font-heading leading-none tracking-wide mt-5 mb-6"
                style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)" }}
              >
                Journalistik som
                <br />
                respekterar din
                <br />
                <span className="text-pitch">fotbollskunskap.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="text-white/55 text-base leading-relaxed max-w-[480px]">
                Vi skriver för dig som vet skillnaden på ett 4-3-3 och ett
                4-2-3-1. Som ser att det hände något i pressningsspelet redan i
                den 12:e minuten. Som vill förstå — inte bara veta.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ label, title, text }, i) => (
              <Reveal key={label} delay={0.06 + i * 0.1}>
                <div className="group bg-white/[0.025] border border-white/[0.06] rounded-2xl p-6 h-full hover:border-pitch/30 hover:bg-pitch/[0.04] transition-all duration-300">
                  <span className="text-pitch text-[10px] font-bold tracking-[0.16em] uppercase">
                    {label}
                  </span>
                  <h3 className="font-sans font-semibold text-white mt-3 mb-2 text-[15px] leading-snug">
                    {title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 5. HOW IT WORKS ───────────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    title: "Välj ditt lag",
    text: "Du tillhör en liga med fans av samma lag. Du tävlar, tippar och diskuterar med dem — inte med hela Sverige.",
  },
  {
    n: "02",
    title: "Läs varje omgång",
    text: "Matchrapporter, taktikanalyser och förhandstittar skrivna av journalister som bryr sig om detaljer. Stäng din matchring. Höj din IQ.",
  },
  {
    n: "03",
    title: "Bli vassare",
    text: "Din Fotbolls-IQ stiger. Din ligaposition klättrar. Du ser saker på planen du inte såg förut. Det är poängen.",
  },
];

function HowItWorks() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="text-center mb-20">
          <Reveal>
            <Label>Så fungerar det</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="font-heading leading-none tracking-wide mt-5"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              Tre saker.
              <br />
              Inte trettio.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line between circles */}
          <div
            aria-hidden
            className="hidden md:block absolute top-7 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(29,158,117,0.25), transparent)",
            }}
          />

          {steps.map(({ n, title, text }, i) => (
            <Reveal key={n} delay={0.08 + i * 0.12}>
              <div className="flex flex-col items-start md:items-center md:text-center">
                <div className="w-14 h-14 rounded-full bg-pitch/10 border border-pitch/20 flex items-center justify-center mb-6 relative z-10">
                  <span className="font-heading text-pitch text-xl tracking-wider">{n}</span>
                </div>
                <h3 className="font-sans font-bold text-white text-xl mb-3">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-[260px]">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── 6. TESTIMONIALS ───────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "Jag förstår Allsvenskan på ett helt annat sätt nu. Det är som att äntligen ha glasögon på.",
    name: "Marcus L.",
    meta: "Djurgårdsfan sedan 1994",
  },
  {
    quote:
      "Äntligen en plats där de inte skriver ner till mig. De förutsätter att jag kan fotboll. Det stämmer.",
    name: "Sara K.",
    meta: "Hammarbysupporter",
  },
  {
    quote:
      "Matchrapporterna läser jag alltid på måndag morgon. Bättre start på veckan finns inte.",
    name: "Johan A.",
    meta: "AIK-fan, Göteborg",
  },
];

function Testimonials() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="text-center mb-20">
          <Reveal>
            <Label>Läsarna säger</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="font-heading leading-none tracking-wide mt-5"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              De som läser
              <br />
              slutar inte läsa.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(({ quote, name, meta }, i) => (
            <Reveal key={name} delay={0.08 + i * 0.1}>
              <div className="flex flex-col gap-5 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-8 h-full hover:border-white/[0.12] transition-colors duration-300">
                <span
                  aria-hidden
                  className="text-pitch font-heading leading-none select-none"
                  style={{ fontSize: "3rem" }}
                >
                  "
                </span>
                <blockquote className="text-white/80 text-base leading-relaxed flex-1">
                  {quote}
                </blockquote>
                <div className="pt-5 border-t border-white/[0.06]">
                  <div className="font-semibold text-white text-sm">— {name}</div>
                  <div className="text-white/35 text-xs mt-1">{meta}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── 7. FOR WHOM ───────────────────────────────────────────────────────────────

const personas = [
  {
    icon: Target,
    title: "Matchdagsfanatikern",
    text: "Ser varje match. Vill förstå varje minut.",
  },
  {
    icon: BarChart3,
    title: "Statistiknörden",
    text: "Älskar xG och pressdata. Vill ha kontexten till siffrorna.",
  },
  {
    icon: MapPin,
    title: "Bortafansen",
    text: "Följer laget på distans. Athopia är förbindelsen till varje omgång.",
  },
  {
    icon: BookOpen,
    title: "Taktikintresserade",
    text: "Ser system och mönster. Vill ha analysen som bekräftar det.",
  },
  {
    icon: Users,
    title: "Den kunniga mamman/pappan",
    text: "Följer barnet. Lärde sig älska fotbollen på riktigt.",
  },
  {
    icon: Star,
    title: "Allsvenskan-experten",
    text: "Kan tabellen utantill. Vill ha samtalet på rätt nivå.",
  },
];

function ForWhom() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="text-center mb-20">
          <Reveal>
            <Label>För dig som</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="font-heading leading-none tracking-wide mt-5"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              Du vet redan
              <br />
              vem du är.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={0.04 + i * 0.07}>
              <div className="flex items-start gap-4 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-6 h-full hover:border-pitch/25 hover:bg-pitch/[0.04] transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-pitch/10 border border-pitch/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-pitch" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-white text-sm mb-1">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── 8. CTA ────────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.07] px-8 py-20 md:px-20 text-center">
          {/* Ambient glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 50% 50%, rgba(29,158,117,0.07) 0%, transparent 70%)",
            }}
          />
          {/* Subtle dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10">
            <Reveal>
              <Label>Säsongen väntar</Label>
            </Reveal>

            <Reveal delay={0.08}>
              <h2
                className="font-heading leading-none tracking-wide mt-5 mb-6"
                style={{ fontSize: "clamp(3.5rem, 9vw, 7.5rem)" }}
              >
                Nästa omgång
                <br />
                läser du den
                <br />
                <span className="text-pitch">här.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-white/55 text-base mb-10 max-w-[380px] mx-auto leading-relaxed">
                Gratis att börja. Inget kreditkort. Välj ditt lag och börja
                läsa.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-pitch text-black font-bold rounded-xl px-10 py-4 text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
              >
                Välj ditt lag <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-white/20 text-xs mt-6">
                Allsvenskan 2025 · 291 artiklar · Uppdateras varje omgång
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 9. FOOTER ─────────────────────────────────────────────────────────────────

const footerCols: Record<string, string[]> = {
  Produkt: ["Allsvenskan", "Matchanalyser", "Fotbolls-IQ"],
  Bolag: ["Om Athopia", "Kontakt", "Press"],
  "Följ oss": ["Twitter/X", "Instagram", "Nyhetsbrev"],
};

function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-10">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div className="col-span-2 md:col-span-1">
            <div className="font-heading text-2xl tracking-widest text-white mb-2">ATHOPIA</div>
            <p className="text-white/35 text-sm">Allsvenskan på djupet.</p>
          </div>

          {Object.entries(footerCols).map(([col, links]) => (
            <div key={col}>
              <h4 className="text-white/40 text-[11px] font-semibold tracking-[0.12em] uppercase mb-4 font-sans">
                {col}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-white/45 text-sm hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            © 2025 Athopia · Alla rättigheter förbehållna
          </p>
          <div className="flex items-center gap-6">
            {["Integritetspolicy", "Villkor"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-white/20 text-xs hover:text-white/50 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
