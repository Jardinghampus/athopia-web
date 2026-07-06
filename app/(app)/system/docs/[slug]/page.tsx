import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownDoc } from "@/components/system/MarkdownDoc";
import { listAllDocs, readDoc } from "@/lib/system/read-doc";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return listAllDocs().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = listAllDocs().find((d) => d.slug === slug);
  return {
    title: doc?.title ?? "Dokumentation",
    robots: { index: false, follow: false },
  };
}

export default async function SystemDocPage({ params }: Props) {
  const { slug } = await params;
  const content = readDoc(slug);
  if (!content) notFound();

  const meta = listAllDocs().find((d) => d.slug === slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <Link
        href="/system/docs"
        className="inline-flex items-center gap-1 text-xs text-pitch hover:underline mb-6"
      >
        <ArrowLeft className="h-3 w-3" />
        All dokumentation
      </Link>
      {meta && (
        <p className="text-[10px] font-mono text-muted-foreground mb-2">{meta.slug}</p>
      )}
      <MarkdownDoc source={content} />
      <div className="mt-10 pt-6 border-t border-border">
        <Link href="/system" className="text-sm text-pitch hover:underline">
          Öppna interaktiv systemkarta →
        </Link>
      </div>
    </div>
  );
}
