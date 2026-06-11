"use client";

import { useRef, ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
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
  Check,
  Home,
  Trophy,
  CreditCard,
  LogIn,
  UserPlus,
  Zap,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { ExpandableTabs, type TabItem } from "@/components/ui/expandable-tabs";
import DisplayCards, { type DisplayCardProps } from "@/components/ui/display-cards";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { LoadingSourcesCard } from "@/components/landing/LoadingSourcesCard";

export interface LandingArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedAt: string;
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { locale: sv, addSuffix: true });
  } catch {
    return "";
  }
}

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
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={reducedMotion || isInView ? { opacity: 1, y: 0 } : {}}
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

export default function AthopiaLanding({
  articles = [],
}: {
  articles?: LandingArticle[];
}) {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen w-full font-sans overflow-x-clip">
      <SiteNav />
      <HeroSection articles={articles} />
      <AiSourcesSection />
      <NewsSection articles={articles} />
      <Pain />
      <ValueProp />
      <HowItWorks />
      <Testimonials />
      <ForWhom />
      <Pricing />
      <Faq />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}

// ── 1. NAV ────────────────────────────────────────────────────────────────────

const desktopNavItems = [
  { name: "Hem", url: "/", icon: Home },
  { name: "Allsvenskan", url: "/allsvenskan", icon: Trophy },
  { name: "Nyheter", url: "/nyheter", icon: Newspaper },
  { name: "Priser", url: "/priser", icon: CreditCard },
];

const mobileTabs: TabItem[] = [
  { title: "Hem", icon: Home, href: "/" },
  { title: "Nyheter", icon: Newspaper, href: "/nyheter" },
  { title: "Allsvenskan", icon: Trophy, href: "/allsvenskan" },
  { type: "separator" },
  { title: "Logga in", icon: LogIn, href: "/sign-in" },
  { title: "Skapa konto", icon: UserPlus, href: "/sign-up" },
];

function SiteNav() {
  return (
    <>
      {/* Toppbar: logo + auth. Tubelight-glasnav centrerad på laptop/ipad. */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="relative flex items-center justify-between px-5 md:px-10 pt-4">
          <Link
            href="/"
            className="font-heading text-2xl tracking-widest text-white hover:text-pitch transition-colors duration-200"
          >
            ATHOPIA
          </Link>

          <NavBar
            items={desktopNavItems}
            className="hidden md:block absolute left-1/2 -translate-x-1/2 top-4"
          />

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden md:inline-flex min-h-11 items-center text-sm text-white/70 hover:text-white border border-white/[0.14] bg-white/[0.05] backdrop-blur-2xl rounded-full px-5 py-2.5 transition-all duration-200 hover:border-white/35"
            >
              Logga in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold bg-pitch text-black rounded-full px-5 py-2.5 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              Skapa konto
            </Link>
          </div>
        </div>
      </header>

      {/* Mobil: app-tabbar längst ner, native-känsla med safe-area */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        <ExpandableTabs tabs={mobileTabs} />
      </div>
    </>
  );
}

// ── 2. HERO ───────────────────────────────────────────────────────────────────

function HeroSection({ articles }: { articles: LandingArticle[] }) {
  const newsCards: DisplayCardProps[] =
    articles.length >= 3
      ? articles.slice(0, 3).map((a, i) => ({
          icon:
            i === 0 ? (
              <Sparkles className="size-4 text-pitch-light" />
            ) : i === 1 ? (
              <Zap className="size-4 text-pitch-light" />
            ) : (
              <Newspaper className="size-4 text-pitch-light" />
            ),
          title: a.sourceName,
          description: a.title,
          date: relativeTime(a.publishedAt),
        }))
      : [
          {
            icon: <Sparkles className="size-4 text-pitch-light" />,
            title: "Athopia AI",
            description: "Dagens sammanfattning är klar",
            date: "Just nu",
          },
          {
            icon: <Zap className="size-4 text-pitch-light" />,
            title: "Nyhetsflödet",
            description: "Headlines från 40+ källor",
            date: "Uppdateras löpande",
          },
          {
            icon: <Newspaper className="size-4 text-pitch-light" />,
            title: "Matchanalys",
            description: "Varje omgång på djupet",
            date: "Varje vecka",
          },
        ];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(29,158,117,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <AnimatedHero />

        {/* Nyheter som poppar in — stackade kort */}
        <Reveal className="flex justify-center px-6 pb-36 pt-4">
          <div className="-translate-x-6 sm:-translate-x-12">
            <DisplayCards cards={newsCards} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── 2b. ATHOPIA AI — källor → analys ─────────────────────────────────────────

function AiSourcesSection() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="text-center mb-16">
          <Reveal>
            <Label>Athopia AI</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-heading leading-[1.08] mt-5 text-display-lg">
              Från 40+ källor.
              <br />
              Till en analys.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <LoadingSourcesCard />
        </Reveal>
      </Container>
    </section>
  );
}

// ── 2c. SENASTE NYTT — bento ─────────────────────────────────────────────────

function NewsSection({ articles }: { articles: LandingArticle[] }) {
  if (articles.length === 0) return null;

  const items: BentoItem[] = articles.slice(0, 4).map((a, i) => ({
    title: a.title,
    description: a.summary || "Läs hela analysen på Athopia.",
    icon:
      i === 0 ? (
        <TrendingUp className="w-4 h-4 text-pitch" />
      ) : (
        <Newspaper className="w-4 h-4 text-pitch" />
      ),
    status: i === 0 ? "Senaste" : "Nyhet",
    meta: relativeTime(a.publishedAt),
    tags: [a.sourceName],
    href: `/artikel/${a.slug}`,
    cta: "Läs mer →",
    colSpan: i === 0 ? 2 : i === 3 ? 2 : 1,
    hasPersistentHover: i === 0,
  }));

  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="flex items-end justify-between mb-12">
          <div>
            <Reveal>
              <Label>Senaste nytt</Label>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="font-heading leading-[1.08] mt-5 text-display-lg">
                Det här läser
                <br />
                fansen just nu.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <Link
              href="/nyheter"
              className="hidden sm:flex items-center gap-1 text-sm text-pitch hover:text-pitch-light transition-colors"
            >
              Alla nyheter <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <BentoGrid items={items} />
        </Reveal>

        <Reveal delay={0.14} className="sm:hidden mt-8 text-center">
          <Link
            href="/nyheter"
            className="inline-flex items-center gap-1 text-sm text-pitch hover:text-pitch-light transition-colors"
          >
            Alla nyheter <ArrowRight className="w-4 h-4" />
          </Link>
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
            className="font-heading leading-[1.08] mt-5 mb-16 max-w-[680px]"
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
                className="font-heading leading-[1.08] mt-5 mb-6"
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
    <section id="sa-fungerar-det" className="py-[120px] border-t border-white/[0.06] scroll-mt-16">
      <Container>
        <div className="text-center mb-20">
          <Reveal>
            <Label>Så fungerar det</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="font-heading leading-[1.08] mt-5"
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
              className="font-heading leading-[1.08] mt-5"
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
              className="font-heading leading-[1.08] mt-5"
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

// ── 8. PRICING ────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Gratis",
    price: "0 kr",
    period: "",
    features: ["Nyhetsflöde med headlines", "Välj lag och liga", "Läs i forumet"],
    cta: "Börja gratis",
    href: "/onboarding",
    highlighted: false,
  },
  {
    name: "PRO",
    price: "89 kr",
    period: "/mån",
    features: [
      "Obegränsat flöde",
      "AI-sammanfattningar per lag och match",
      "Smart ranking och avancerade filter",
      "Push-notiser",
      "Skriv i forumet",
    ],
    cta: "Uppgradera till PRO",
    href: "/prenumerera",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "169 kr",
    period: "/mån",
    features: [
      "Allt i PRO",
      "Korskällsanalys av nyheter",
      "Vad som spelar roll för ditt lag idag",
      "Trendspaning — rykten som eskalerar",
    ],
    cta: "Uppgradera till Elite",
    href: "/prenumerera",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="text-center mb-20">
          <Reveal>
            <Label>Priser</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              className="font-heading leading-[1.08] mt-5"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              Börja gratis.
              <br />
              Väx när du vill.
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="text-white/45 text-sm mt-6">25 % rabatt på årsplan</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[980px] mx-auto">
          {plans.map(({ name, price, period, features, cta, href, highlighted }, i) => (
            <Reveal key={name} delay={0.08 + i * 0.1}>
              <div
                className={`flex flex-col rounded-2xl p-8 h-full border transition-all duration-300 ${
                  highlighted
                    ? "bg-pitch/[0.06] border-pitch/35 hover:border-pitch/55"
                    : "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-sans font-bold text-white text-lg">{name}</h3>
                  {highlighted && (
                    <span className="bg-pitch/20 text-pitch text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase">
                      Populärast
                    </span>
                  )}
                </div>
                <div className="mb-7">
                  <span className="font-heading text-5xl text-white tracking-wide">{price}</span>
                  {period && <span className="text-white/40 text-sm ml-1">{period}</span>}
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check className="w-4 h-4 text-pitch flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    highlighted
                      ? "bg-pitch text-black"
                      : "border border-white/20 text-white hover:border-white/45"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── 9. FAQ ────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: "Vad är Athopia?",
    a: "En plattform för dig som följer Allsvenskan på djupet: matchanalyser, nyhetsflöde, statistik, podcasts och ett forum för ditt lag — allt på ett ställe.",
  },
  {
    q: "Vad kostar det?",
    a: "Det är gratis att börja. PRO kostar 89 kr/mån och Elite 169 kr/mån, med 25 % rabatt om du väljer årsplan.",
  },
  {
    q: "Behöver jag kreditkort för att börja?",
    a: "Nej. Du väljer ditt lag och börjar läsa direkt — helt utan kort.",
  },
  {
    q: "Kan jag avsluta när som helst?",
    a: "Ja. Du avslutar själv på kontosidan och behåller tillgången till slutet av din betalda period.",
  },
  {
    q: "Vilka lag täcker ni?",
    a: "Alla 16 lag i Allsvenskan — nyheter, analys, statistik och forum för vart och ett.",
  },
  {
    q: "Vad är Fotbolls-IQ?",
    a: "Din personliga kunskapsrating. Den stiger när du läser, tippar och följer matcherna — och du tävlar i en liga med fans av samma lag.",
  },
];

function Faq() {
  return (
    <section className="py-[120px] border-t border-white/[0.06]">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <div>
            <Reveal>
              <Label>Vanliga frågor</Label>
            </Reveal>
            <Reveal delay={0.08}>
              <h2
                className="font-heading leading-[1.08] mt-5"
                style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}
              >
                Undrar du
                <br />
                något?
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="flex flex-col gap-3">
              {faqItems.map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-white/[0.025] border border-white/[0.06] rounded-2xl open:border-white/[0.14] transition-colors duration-200"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-white font-sans font-semibold text-[15px] [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="text-pitch text-xl leading-none transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-6 text-white/55 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

// ── 10. CTA ───────────────────────────────────────────────────────────────────

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
                className="font-heading leading-[1.08] mt-5 mb-6"
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
                Allsvenskan 2026 · Uppdateras varje omgång
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 11. FOOTER ────────────────────────────────────────────────────────────────

const footerCols: Record<string, { label: string; href: string }[]> = {
  Produkt: [
    { label: "Allsvenskan", href: "/allsvenskan" },
    { label: "Matchanalyser", href: "/analys" },
    { label: "Statistik", href: "/statistik" },
    { label: "Priser", href: "/priser" },
  ],
  Community: [
    { label: "Forum", href: "/forum" },
    { label: "Nyheter", href: "/nyheter" },
    { label: "Podcasts", href: "/podcast" },
  ],
  Konto: [
    { label: "Logga in", href: "/sign-in" },
    { label: "Skapa konto", href: "/sign-up" },
    { label: "Mitt konto", href: "/konto" },
  ],
};

function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-32 md:pb-10">
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
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-white/45 text-sm hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} Athopia · Alla rättigheter förbehållna
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/integritetspolicy"
              className="text-white/20 text-xs hover:text-white/50 transition-colors duration-200"
            >
              Integritetspolicy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
