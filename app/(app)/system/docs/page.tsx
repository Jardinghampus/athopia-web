import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Cpu } from "lucide-react";
import { listAllDocs } from "@/lib/system/read-doc";

export const metadata: Metadata = {
  title: "Produktdokumentation",
  description: "Feature-docs och AI felsökningsguider för Athopia.",
  robots: { index: false, follow: false },
};

export default function SystemDocsIndexPage() {
  const docs = listAllDocs();
  const guides = docs.filter((d) => d.kind === "guide");
  const features = docs.filter((d) => d.kind === "feature");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 space-y-8">
      <div>
        <Link
          href="/system"
          className="inline-flex items-center gap-1 text-xs text-pitch hover:underline mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Tillbaka till systemkartan
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Dokumentation</h1>
        <p className="text-sm text-muted-foreground mt-2">
          En doc per funktion — hur den är byggd och var AI ska leta vid felsökning.
        </p>
      </div>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <Cpu className="h-4 w-4" />
          Guider
        </h2>
        <ul className="space-y-2">
          {guides.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/system/docs/${d.slug}`}
                className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-pitch/40 transition-colors"
              >
                <span className="font-medium text-foreground">{d.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <BookOpen className="h-4 w-4" />
          Features
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {features.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/system/docs/${d.slug}`}
                className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-pitch/40 transition-colors"
              >
                <span className="font-medium text-foreground">{d.title}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {d.slug}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
