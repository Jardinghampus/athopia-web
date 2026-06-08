import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Analys",
  description: "Djupanalys och AI-insikter (kommer snart) på Athopia.",
};

export default function AnalysPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-heading text-5xl text-foreground mb-4">ANALYS</h1>
      <p className="text-muted-foreground">
        Analys-ytan byggs just nu. Under tiden hittar du narrativ, lag och artiklar på startsidan.
      </p>
    </div>
  );
}

