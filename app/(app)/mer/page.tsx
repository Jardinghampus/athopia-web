import type { Metadata } from "next";
import { MessageSquare, Sparkles, Headphones, User, CreditCard, Info, BarChart3 } from "lucide-react";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";

export const metadata: Metadata = {
  title: "Mer",
  description: "Forum, AI-chatt, poddar, konto och prenumeration.",
};

export default function MerPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-bebas)" }}>
        MER
      </h1>

      <ListGroup>
        <ListRow href="/forum" leading={<MessageSquare />} title="Forum" subtitle="Diskutera med andra supportrar" />
        <ListRow href="/ai" leading={<Sparkles />} title="AI-chatt" subtitle="Fråga Athopia om Allsvenskan" />
        <ListRow href="/podcast" leading={<Headphones />} title="Poddar" subtitle="Allsvenskan-poddar samlade" />
        <ListRow href="/statistik" leading={<BarChart3 />} title="Statistik" subtitle="Spelare, jämförelser och scout" />
      </ListGroup>

      <ListGroup>
        <ListRow href="/konto" leading={<User />} title="Konto" />
        <ListRow href="/prenumerera" leading={<CreditCard />} title="Prenumeration" />
        <ListRow href="/om-oss" leading={<Info />} title="Om Athopia" />
      </ListGroup>
    </div>
  );
}
