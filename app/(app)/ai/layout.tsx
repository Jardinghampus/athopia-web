import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-chatt — fråga om Allsvenskan | Nano Fotboll",
  description:
    "Ställ frågor om Allsvenskan — tabell, form, spelare och statistik. Nano Fotbolls AI svarar med synkad data.",
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
