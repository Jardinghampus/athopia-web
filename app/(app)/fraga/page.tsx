/**
 * /fraga — "Fråga Athopia" (Slice 3 P1). Behind FRAGA_ATHOPIA flag, off by
 * default so prod is unchanged. No nav entry — direct link only.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFragaAthopiaEnabled } from "@/lib/ask/retrieve";
import { FragaClient } from "./FragaClient";

export function generateMetadata(): Metadata {
  if (!isFragaAthopiaEnabled()) return {};
  return {
    title: "Fråga Athopia",
    description: "Ställ en fråga om svensk fotboll — svaret bygger enbart på Athopias underlag, med källor.",
  };
}

export default function FragaPage() {
  if (!isFragaAthopiaEnabled()) notFound();
  return <FragaClient />;
}
