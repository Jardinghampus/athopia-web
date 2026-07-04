import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-chatt — fråga om Allsvenskan | Athopia",
  description:
    "Ställ frågor om Allsvenskan — tabell, form, spelare och statistik. Athopias AI svarar med synkad data.",
};

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
