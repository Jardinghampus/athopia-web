"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  BarChart2,
  MessageSquare,
  Bell,
  Radio,
  Brain,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  Newspaper,
  Mic,
  Users,
} from "lucide-react";
import { BoltStyleChat } from "@/components/ui/bolt-style-chat";
import { AwardBadge } from "@/components/ui/award-badge";
import HeroBadge from "@/components/ui/hero-badge";
import DisplayCards from "@/components/ui/display-cards";
import { Icons } from "@/components/ui/icons";

const TIERS = [
  {
    name: "Gratis",
    price: "0",
    desc: "Kom igång utan kostnad.",
    features: [
      "Nyheter (24h fördröjning)",
      "Allsvenskan-tabell & resultat",
      "Läs forum",
      "1 push-notis per dag",
    ],
    cta: "Skapa konto",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "PRO",
    price: "99",
    desc: "För den seriösa supportern.",
    features: [
      "Nyheter i realtid",
      "AI-analys i Athletic-stil",
      "Statistik + xG",
      "Podcast-transkript",
      "Skriv i forum",
      "10 push-notiser per dag",
    ],
    cta: "Prova PRO",
    href: "/prenumerera",
    highlight: true,
  },
  {
    name: "Elite",
    price: "199",
    desc: "För den som vill ha allt.",
    features: [
      "Allt i PRO",
      "Djupanalys & historisk data",
      "API-access",
      "Obegränsade push-notiser",
      "Tidig tillgång till nya features",
    ],
    cta: "Bli Elite",
    href: "/prenumerera?tier=elite",
    highlight: false,
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Realtidsnyheter",
    desc: "Alla svenska fotbollskällor samlade — Fotbollskanalen, SVT, Aftonbladet och 25+ till.",
  },
  {
    icon: Brain,
    title: "AI-sammanfattningar",
    desc: "Dagliga briefings och matchanalyser i The Athletic-stil. Egna slutsatser, data-drivna.",
  },
  {
    icon: BarChart2,
    title: "Djupstatistik",
    desc: "xG, pressing, form, skytteliga och head-to-head från Sportsmonks.",
  },
  {
    icon: MessageSquare,
    title: "Lag-forum",
    desc: "Diskutera med andra supporters. Modererat, strukturerat, med AI-sammanfattningar.",
  },
  {
    icon: Bell,
    title: "Smart push",
    desc: "Breaking news direkt. Aldrig spam — bara det som spelar roll för ditt lag.",
  },
  {
    icon: Radio,
    title: "Podcast-hub",
    desc: "Ligapodden, Offside, DIF-podden och fler. Med transkript och sökbar historik.",
  },
];

const DISPLAY_CARDS = [
  {
    icon: <Newspaper className="size-4 text-pitch-light" />,
    title: "Nyheter",
    description: "Hammarby vann med 2-0",
    date: "2 min sedan",
    titleClassName: "text-pitch",
    className:
      "[grid-area:stack] hover:-translate-y-6 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <BarChart2 className="size-4 text-pitch-light" />,
    title: "Statistik",
    description: "xG: 2.4 vs 0.8",
    date: "Efter match",
    titleClassName: "text-pitch",
    className:
      "[grid-area:stack] translate-x-10 translate-y-6 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Mic className="size-4 text-pitch-light" />,
    title: "Podcast",
    description: "Ligapodden — omgång 12",
    date: "Igår",
    titleClassName: "text-pitch",
    className:
      "[grid-area:stack] translate-x-20 translate-y-12 hover:translate-y-6",
  },
];

const ALLSVENSKAN_TEAMS = [
  { name: "AIK", slug: "aik" },
  { name: "Djurgårdens IF", slug: "djurgarden" },
  { name: "Hammarby IF", slug: "hammarby" },
  { name: "IFK Göteborg", slug: "ifk-goteborg" },
  { name: "Malmö FF", slug: "malmo-ff" },
  { name: "IFK Norrköping", slug: "ifk-norrkoping" },
  { name: "BK Häcken", slug: "bk-hacken" },
  { name: "Elfsborg", slug: "elfsborg" },
];

function PriceBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-pitch text-white uppercase tracking-widest">
      <Star className="w-3 h-3 fill-white" />
      Mest populär
    </span>
  );
}

export default function AthopiaLanding() {
  const router = useRouter();

  const handleSend = (message: string) => {
    router.push(`/sign-up?prompt=${encodeURIComponent(message)}`);
  };

  const handleImport = (team: string) => {
    router.push(`/lag/${team}`);
  };

  return (
    <>
      {/* ── HERO: Bolt-style chat ───────────────────────────────────────── */}
      <BoltStyleChat
        onSend={handleSend}
        onImport={handleImport}
        announcementHref="#features"
      >
        <header className="absolute top-0 left-0 right-0 z-30 border-b border-white/5 bg-[#0f0f0f]/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-heading text-2xl text-white hover:text-pitch-light transition-colors"
            >
              ATHOPIA
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/nyheter"
                className="hidden sm:block text-sm text-[#8a8a8f] hover:text-white transition-colors"
              >
                Utforska
              </Link>
              <Link
                href="/prenumerera"
                className="px-4 py-2 rounded-full pitch-gradient text-white text-sm font-medium hover:-translate-y-0.5 transition-all duration-200 shadow-sm shadow-pitch/20"
              >
                Prova PRO
              </Link>
            </div>
          </div>
        </header>
      </BoltStyleChat>

      {/* ── LAG-STRIP ──────────────────────────────────────────────────── */}
      <div className="border-b border-border overflow-hidden bg-muted/30 py-3">
        <div className="flex gap-6 px-6 overflow-x-auto scrollbar-none">
          {ALLSVENSKAN_TEAMS.map((team) => (
            <Link
              key={team.slug}
              href={`/lag/${team.slug}`}
              className="flex-none text-xs font-medium text-muted-foreground hover:text-pitch transition-colors whitespace-nowrap"
            >
              {team.name}
            </Link>
          ))}
          <span className="flex-none text-xs text-muted-foreground whitespace-nowrap">
            + 8 lag till →
          </span>
        </div>
      </div>

      {/* ── BENTO FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-12">
          <HeroBadge
            href="/nyheter"
            text="Nytt! AI-sammanfattningar var 6:e timme"
            icon={<Icons.football className="h-4 w-4" />}
            endIcon={<Icons.chevronRight className="h-4 w-4" />}
            variant="outline"
            className="border-pitch/30 bg-pitch/5 text-pitch mb-6"
          />
          <h2 className="font-heading text-5xl sm:text-6xl text-foreground mb-4">
            ALLSVENSKAN PÅ ETT STÄLLE
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Sveriges bästa Allsvenskan-community. Nyheter, AI, statistik och forum — byggt för supporters som vill gå djupare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(180px,auto)]">
          {/* Bento: Display cards */}
          <div className="md:col-span-2 md:row-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden relative group hover:border-pitch/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-pitch mb-1">
                  Live-flöde
                </p>
                <h3 className="font-heading text-2xl text-foreground">
                  Senaste från Allsvenskan
                </h3>
              </div>
              <Link
                href="/nyheter"
                className="text-xs text-muted-foreground hover:text-pitch flex items-center gap-1 transition-colors"
              >
                Visa alla <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="flex items-center justify-center py-4 scale-[0.65] sm:scale-75 origin-center -my-8">
              <DisplayCards cards={DISPLAY_CARDS} />
            </div>
          </div>

          {/* Bento: Award badge */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-4 hover:border-pitch/30 transition-all duration-300 min-h-[220px]">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Byggt för Sverige
            </p>
            <AwardBadge type="athopia" link="/nyheter" />
            <p className="text-xs text-muted-foreground text-center max-w-[200px]">
              Allsvenskans hemma på nätet — som The Athletic, fast för svensk fotboll.
            </p>
          </div>

          {/* Bento: Stats highlight */}
          <div className="rounded-2xl border border-pitch/20 bg-pitch/5 p-6 hover:border-pitch/40 transition-all duration-300">
            <BarChart2 className="size-8 text-pitch mb-3" />
            <h3 className="font-heading text-xl text-foreground mb-2">xG & data</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pressing, formkurvor, skytteliga och head-to-head — allt från Sportsmonks.
            </p>
            <Link
              href="/statistik"
              className="inline-flex items-center gap-1 text-sm text-pitch mt-4 hover:text-pitch-light transition-colors"
            >
              Utforska statistik <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Feature cards row */}
          {FEATURES.slice(0, 3).map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-pitch/30 hover:bg-pitch/[0.02] transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-pitch/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-pitch" />
              </div>
              <h3 className="font-heading text-xl text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Remaining features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
          {FEATURES.slice(3).map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-pitch/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-pitch/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-pitch" />
              </div>
              <h3 className="font-heading text-xl text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI-SHOWCASE ────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-pitch/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-pitch text-xs font-medium uppercase tracking-widest mb-4">
                <Brain className="w-4 h-4" />
                Athopia AI
              </div>
              <h2 className="font-heading text-5xl sm:text-6xl text-foreground mb-6 leading-none">
                ANALYS PÅ
                <br />
                ATHLETIC-STIL
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Våra AI-sammanfattningar är inte &quot;Enligt källor uppger...&quot; —
                de är &quot;Vår analys visar att Hammarbys defensiva problem går djupare
                än enskilda misstag.&quot; Egna slutsatser. Data-drivna.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Daglig Allsvenskan-briefing kl 07:00 och 18:00",
                  "Lag-sammanfattning var 6:e timme",
                  "Matchanalys 30 min efter slutsignal",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-pitch shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/prenumerera"
                className="inline-flex items-center gap-2 text-sm text-pitch hover:text-pitch-light font-medium transition-colors"
              >
                Prova PRO <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-pitch/20 bg-pitch/5 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-pitch" />
                <span className="text-xs font-semibold text-pitch uppercase tracking-widest">
                  Athopia AI
                </span>
                <span className="text-xs text-muted-foreground ml-auto">idag 07:00</span>
              </div>
              <h3 className="font-heading text-2xl text-foreground mb-4 leading-tight">
                Allsvenskan idag
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Hammarbys tvåmålsseger döljer ett defensivt mönster som oroar inför toppmötena.
                </p>
                <ul className="space-y-2 list-none">
                  {[
                    "AIK stärker ledningen till 4 poäng efter Djurgårdens oavgjorda",
                    "Elfsborgs anfallare bäst i ligan sett till xG senaste 5 omgångarna",
                    "Malmö FF bekräftar kontakt med dansk förbundskapten",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-pitch mt-1 shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="pt-2 border-t border-border text-xs italic">
                  Vår analys visar att titelracet fortfarande är öppet — men AIK:s
                  formkurva ger dem ett strukturellt övertag framöver.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
          <Users className="size-10 text-pitch mx-auto mb-4" />
          <h2 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">
            DITT LAGS COMMUNITY
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Forum, diskussioner och AI-sammanfattningar av vad supporters faktiskt pratar om — per lag, varje dag.
          </p>
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-pitch/30 text-pitch hover:bg-pitch/10 transition-all duration-200"
          >
            Utforska forum <ChevronRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── PRISSÄTTNING ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24" id="priser">
        <div className="text-center mb-16">
          <h2 className="font-heading text-5xl sm:text-6xl text-foreground mb-4">
            VÄLJ DIN NIVÅ
          </h2>
          <p className="text-muted-foreground text-base">
            Börja gratis. Uppgradera när du är redo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                tier.highlight
                  ? "border-pitch bg-pitch/5 shadow-lg shadow-pitch/10"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <PriceBadge />
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-heading text-2xl text-foreground mb-1">{tier.name}</h3>
                <p className="text-xs text-muted-foreground">{tier.desc}</p>
              </div>

              <div className="mb-6">
                <span className="font-heading text-5xl text-foreground">{tier.price}</span>
                <span className="text-muted-foreground text-sm ml-1">kr/mån</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check
                      className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? "text-pitch" : "text-muted-foreground"}`}
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`w-full text-center py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  tier.highlight
                    ? "pitch-gradient text-white hover:shadow-lg hover:shadow-pitch/20 hover:-translate-y-0.5"
                    : "border border-border bg-background hover:border-pitch/40 text-foreground hover:-translate-y-0.5"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATISTIK-STRIPE ───────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "16", label: "Allsvenskan-lag" },
              { value: "25+", label: "Nyhetskällor" },
              { value: "6h", label: "AI-uppdateringar" },
              { value: "99 kr", label: "PRO per månad" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-5xl sm:text-6xl text-pitch mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-32 text-center">
        <h2 className="font-heading text-6xl sm:text-8xl text-foreground mb-6 leading-none">
          FÖLJ SPELET
          <br />
          <span className="text-pitch">DJUPARE</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Tusentals Allsvenskan-supporters har redan valt Athopia.
          Välj ditt lag — vi sköter resten.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/prenumerera"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full pitch-gradient text-white font-medium shadow-xl shadow-pitch/20 hover:shadow-pitch/30 hover:-translate-y-1 transition-all duration-200"
          >
            Kom igång — 7 dagar gratis
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/nyheter"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-border text-foreground hover:border-pitch/40 hover:-translate-y-1 transition-all duration-200"
          >
            Se nyhetsflödet
          </Link>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Inga kortuppgifter · Avsluta när du vill · Alltid gratis basplan
        </p>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-heading text-xl text-foreground">ATHOPIA</span>
          <div className="flex items-center gap-6">
            <Link href="/nyheter" className="hover:text-foreground transition-colors">
              Nyheter
            </Link>
            <Link href="/allsvenskan" className="hover:text-foreground transition-colors">
              Allsvenskan
            </Link>
            <Link href="/prenumerera" className="hover:text-foreground transition-colors">
              PRO
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Athopia</span>
        </div>
      </footer>
    </>
  );
}
