import type { Metadata } from "next";
import {
  Sparkles,
  Headphones,
  User,
  CreditCard,
  Info,
  BarChart3,
  FileSearch,
  MessageSquare,
} from "lucide-react";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";

export const metadata: Metadata = {
  title: "Mer",
  description: "Forum, statistik, poddar, konto och prenumeration.",
};

/** Overflow utanför bottenraden (Mitt lag · Flöde · Allsvenskan · Matcher · AI). */
export default function MerPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        MER
      </h1>

      <ListGroup>
        <ListRow
          href="/forum"
          leading={<MessageSquare />}
          title="Forum"
          subtitle="Diskutera med andra supporters"
        />
        <ListRow
          href="/statistik"
          leading={<BarChart3 />}
          title="Statistik"
          subtitle="Spelare, jämförelser och scout"
        />
        <ListRow
          href="/analys"
          leading={<FileSearch />}
          title="Matchanalyser"
          subtitle="xG, pressure och form efter varje match"
        />
        <ListRow
          href="/daily"
          leading={<Headphones />}
          title="Athopia Daily"
          subtitle="7 min morgonbrief — lyssna här"
        />
        <ListRow
          href="/podcast"
          leading={<Headphones />}
          title="Poddar"
          subtitle="Allsvenskan-poddar samlade"
        />
        <ListRow
          href="/ai"
          leading={<Sparkles />}
          title="AI-chatt"
          subtitle="Också i bottenraden"
        />
      </ListGroup>

      <ListGroup>
        <ListRow href="/konto" leading={<User />} title="Konto" />
        <ListRow href="/prenumerera" leading={<CreditCard />} title="Prenumeration" />
        <ListRow href="/om-oss" leading={<Info />} title="Om Athopia" />
      </ListGroup>
    </div>
  );
}
