import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integritetspolicy | Athopia",
  description: "Hur Athopia hanterar dina personuppgifter.",
};

export default function IntegritetspolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-bold text-4xl text-foreground mb-6">Integritetspolicy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Athopia (&quot;vi&quot;, &quot;oss&quot;) värnar om din integritet. Denna policy beskriver
          vilka uppgifter vi samlar in, hur de används och dina rättigheter.
        </p>

        <section>
          <h2 className="font-semibold text-2xl text-foreground mb-3">Vilka uppgifter samlar vi in?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>E-postadress och profilinformation (via Clerk)</li>
            <li>Betalningsinformation (hanteras av Stripe)</li>
            <li>Läsbeteende och preferenser för att personalisera ditt flöde</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-foreground mb-3">Hur använder vi uppgifterna?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>För att tillhandahålla och förbättra tjänsten</li>
            <li>För att hantera prenumerationer och betalningar</li>
            <li>För att skicka relevanta notiser (om du godkänt det)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-foreground mb-3">Dina rättigheter</h2>
          <p>
            Du har rätt att begära tillgång till, rättelse eller radering av dina personuppgifter.
            Kontakta oss på <a href="mailto:hej@athopia.se" className="text-pitch hover:underline">hej@athopia.se</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-2xl text-foreground mb-3">Cookies</h2>
          <p>
            Vi använder nödvändiga cookies för autentisering och sessionhantering.
            Inga tredjepartsspårningscookies används utan ditt samtycke.
          </p>
        </section>

        <p className="text-sm">Senast uppdaterad: juni 2026</p>
      </div>
    </div>
  );
}
