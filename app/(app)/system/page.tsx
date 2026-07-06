import type { Metadata } from "next";
import { SystemExplorer } from "@/components/system/SystemExplorer";

export const metadata: Metadata = {
  title: "System & arkitektur",
  description: "Interaktiv karta över hur signaler flödar genom Athopia.",
  robots: { index: false, follow: false },
};

export default function SystemPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <SystemExplorer />
    </div>
  );
}
