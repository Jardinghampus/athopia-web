import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om Athopia – Svensk fotbollsintelligens för Allsvenskan",
  description: "Lär dig mer om Athopia — AI-driven nyhetsplattform för Allsvenskan med signalscoring, djupstatistik och lagforum.",
  alternates: { canonical: "https://athopia.se/om-oss" },
  robots: { index: true, follow: true },
};

export default function OmOssPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Athopia",
        url: "https://athopia.se",
        foundingDate: "2026",
        description: "AI-driven nyhetsplattform för Allsvenskan med signalscoring, djupstatistik och lagforum.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hej@athopia.se",
          contactType: "editorial",
        },
        publishingPrinciples: "https://athopia.se/om-oss",
        inLanguage: "sv",
      })}} />

      <div>
        <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-4">Om Athopia</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Athopia är en oberoende nyhetsplattform för Allsvenskan. Vi samlar signaler från över 40 svenska och internationella fotbollskällor, värderar dem med AI och presenterar det som faktiskt spelar roll — utan brus.
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-2xl text-foreground mb-3">Vår metod</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Varje nyhet som når oss passerar genom ett signalscoringssystem. Systemet väger källans trovärdighet, nyhetens aktualitet och hur många oberoende källor som rapporterar om samma händelse. Nyheter med hög signalstyrka — till exempel en bekräftad transfer rapporterad av tre eller fler källor — lyfts upp i flödet.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Matchanalyser och sammanfattningar bygger på matchstatistik och nyhetsflödet. Vi publicerar aldrig råtext från tredjepartskällor — allt redaktionellt innehåll är egenproducerat.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-2xl text-foreground mb-3">Datakällor</h2>
        <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
          <li><strong className="text-foreground">Matchdata:</strong> Sportmonks API — officiell leverantör av Allsvenskan-statistik, resultat och spelartrupper.</li>
          <li><strong className="text-foreground">Nyheter:</strong> RSS-flöden från över 40 svenska fotbollsmedier och officiella klubbkanaler.</li>
          <li><strong className="text-foreground">Podcasts:</strong> Transkriberade avsnitt från de ledande svenska fotbollspodcastsarna.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-2xl text-foreground mb-3">Kontakt</h2>
        <p className="text-muted-foreground leading-relaxed">
          Frågor, rättelser eller samarbetsförfrågningar skickas till{" "}
          <a href="mailto:hej@athopia.se" className="text-pitch hover:underline">hej@athopia.se</a>.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-2xl text-foreground mb-3">Integritet</h2>
        <p className="text-muted-foreground leading-relaxed">
          Hur vi hanterar personuppgifter beskrivs i vår{" "}
          <Link href="/integritetspolicy" className="text-pitch hover:underline">integritetspolicy</Link>.
        </p>
      </section>
    </div>
  );
}
