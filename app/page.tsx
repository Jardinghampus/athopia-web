import type { Metadata } from "next";
import AthopiaLanding from "@/components/landing/AthopiaLanding";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Athopia — Allsvenskans hemma på nätet",
  description:
    "Realtidsnyheter, AI-sammanfattningar, djupstatistik och ditt lags forum — allt på ett ställe. Allsvenskan-versionen av The Athletic.",
};

export default function LandingPage() {
  return <AthopiaLanding />;
}
