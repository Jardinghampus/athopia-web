import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap, BarChart2, MessageSquare, Bell, Radio, Brain,
  ChevronRight, Check, Star, ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Athopia — Allsvenskans hemma på nätet",
  description:
    "Realtidsnyheter, AI-analys, djupstatistik och ditt lags forum — allt på ett ställe. Allsvenskan-versionen av The Athletic.",
};

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
    href: "/app/prenumerera",
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
    href: "/app/prenumerera?tier=elite",
    highlight: false,
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Realtidsnyheter",
    desc: "Alla svenska fotbollskällor samlade — Fotbollskanalen, SVT, Aftonbladet och 25+ till. Filtrerade och sorterade per lag.",
  },
  {
    icon: Brain,
    title: "AI-analys",
    desc: "Dagliga sammanfattningar skrivna av Athopia AI i The Athletic-stil. Inte citat — egna slutsatser och analys.",
  },
  {
    icon: BarChart2,
    title: "Djupstatistik",
    desc: "xG, pressing, form, skytteliga, assistligan och head-to-head. All data från Sportsmonks, sorterad efter lag.",
  },
  {
    icon: MessageSquare,
    title: "Lag-forum",
    desc: "Diskutera med andra supporters i ditt lags forum. Modererat, strukturerat, med timmes-AI-sammanfattningar.",
  },
  {
    icon: Bell,
    title: "Smart push",
    desc: "Breaking news direkt (2 min), vanliga nyheter samlade. Aldrig spam — bara det som faktiskt spelar roll.",
  },
  {
    icon: Radio,
    title: "Podcast-hub",
    desc: "Ligapodden, Offside, DIF-podden och fler. Med transkript, lag-taggar och sökbar historik.",
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
  { name: "Kalmar FF", slug: "kalmar-ff" },
  { name: "Mjällby AIF", slug: "mjallby-aif" },
];

function PriceBadge({ popular }: { popular: boolean }) {
  if (!popular) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-pitch text-white uppercase tracking-widest">
      <Star className="w-3 h-3 fill-white" />
      Mest populär
    </span>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-heading text-2xl text-foreground hover:text-pitch transition-colors">
            ATHOPIA
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/app/nyheter"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Utforska
            </Link>
            <Link
              href="/app/prenumerera"
              className="px-4 py-2 rounded-full pitch-gradient text-white text-sm font-medium hover:-translate-y-0.5 transition-all duration-200 shadow-sm shadow-pitch/20"
            >
              Prova PRO
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col">
        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-pitch/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-pitch/5 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pitch/30 bg-pitch/5 text-pitch text-xs font-medium tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
              Allsvenskan — säsong 2025
            </div>

            <h1 className="font-heading text-6xl sm:text-8xl lg:text-[110px] text-foreground leading-none tracking-wide mb-6">
              ALLSVENSKAN<br />
              <span className="text-pitch">PÅ DJUPET</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Athopia är Allsvenskan-versionen av The Athletic. Realtidsnyheter,
              AI-analys, statistik och ditt lags forum — allt på ett ställe.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/app/prenumerera"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full pitch-gradient text-white font-medium text-sm shadow-lg shadow-pitch/20 hover:shadow-pitch/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Prova PRO gratis i 7 dagar
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/app/nyheter"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card text-foreground font-medium text-sm hover:border-pitch/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Se senaste nytt
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Inga kortuppgifter krävs · Avsluta när du vill
            </p>
          </div>
        </section>

        {/* ── LAG-STRIP ──────────────────────────────────────────────────── */}
        <div className="border-b border-border overflow-hidden bg-muted/30 py-3">
          <div className="flex gap-6 px-6 overflow-x-auto scrollbar-none">
            {ALLSVENSKAN_TEAMS.map((team) => (
              <Link
                key={team.slug}
                href={`/app/lag/${team.slug}`}
                className="flex-none text-xs font-medium text-muted-foreground hover:text-pitch transition-colors whitespace-nowrap"
              >
                {team.name}
              </Link>
            ))}
            <span className="flex-none text-xs text-muted-foreground whitespace-nowrap">+ 6 lag till →</span>
          </div>
        </div>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="font-heading text-5xl sm:text-6xl text-foreground mb-4">
              ALLT DU BEHÖVER
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              En app för hela Allsvenskan-upplevelsen. Inte fem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-pitch/30 hover:bg-pitch/[0.02] transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-pitch/10 flex items-center justify-center mb-4 group-hover:bg-pitch/15 transition-colors">
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
                  ANALYS PÅ<br />ATHLETIC-STIL
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Våra AI-sammanfattningar är inte "Enligt källor uppger..." —
                  de är "Vår analys visar att Hammarbys defensiva problem går djupare
                  än enskilda misstag." Egna slutsatser. Data-drivna.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Daglig Allsvenskan-briefing kl 07:00 och 18:00", "Lag-sammanfattning var 6:e timme", "Matchanalys 30 min efter slutsignal"].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-pitch shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app/prenumerera"
                  className="inline-flex items-center gap-2 text-sm text-pitch hover:text-pitch-light font-medium transition-colors"
                >
                  Prova PRO <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-pitch/20 bg-pitch/5 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-pitch" />
                  <span className="text-xs font-semibold text-pitch uppercase tracking-widest">Athopia AI</span>
                  <span className="text-xs text-muted-foreground ml-auto">idag 07:00</span>
                </div>
                <h3 className="font-heading text-2xl text-foreground mb-4 leading-tight">
                  Allsvenskan idag — måndag 2 juni
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
                    formkurva och offensiva djup ger dem ett strukturellt övertag framöver.
                  </p>
                </div>
              </div>
            </div>
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
                    <PriceBadge popular />
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
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? "text-pitch" : "text-muted-foreground"}`} />
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
                  <div className="font-heading text-5xl sm:text-6xl text-pitch mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-32 text-center">
          <h2 className="font-heading text-6xl sm:text-8xl text-foreground mb-6 leading-none">
            FÖLJ SPELET<br />
            <span className="text-pitch">DJUPARE</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Tusentals Allsvenskan-supporters har redan valt Athopia.
            Välj ditt lag — vi sköter resten.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app/prenumerera"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full pitch-gradient text-white font-medium shadow-xl shadow-pitch/20 hover:shadow-pitch/30 hover:-translate-y-1 transition-all duration-200"
            >
              Kom igång — 7 dagar gratis
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app/nyheter"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-border text-foreground hover:border-pitch/40 hover:-translate-y-1 transition-all duration-200"
            >
              Se nyhetsflödet
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Inga kortuppgifter · Avsluta när du vill · Alltid gratis basplan
          </p>
        </section>

        {/* ── FOOTER (minimal, landing) ───────────────────────────────────── */}
        <footer className="border-t border-border/50 py-8 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span className="font-heading text-xl text-foreground">ATHOPIA</span>
            <div className="flex items-center gap-6">
              <Link href="/app/nyheter" className="hover:text-foreground transition-colors">Nyheter</Link>
              <Link href="/app/allsvenskan" className="hover:text-foreground transition-colors">Allsvenskan</Link>
              <Link href="/app/prenumerera" className="hover:text-foreground transition-colors">PRO</Link>
            </div>
            <span>© {new Date().getFullYear()} Athopia</span>
          </div>
        </footer>
      </div>
    </>
  );
}
