/**
 * /rykten — Ryktesradar (Slice 3). Behind RUMOR_RADAR flag, off by default
 * so prod is unchanged. Confidence-driven status (ryktas/rapporteras/
 * bekraftat/dementerat), distinct from the existing team-hub TransferRadar.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRumorRadar,
  isRumorRadarEnabled,
  type RumorRadarItem,
  type RumorStatus,
} from "@/lib/rumor/rumor-radar";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  if (!isRumorRadarEnabled()) return {};
  return {
    title: "Ryktesradar — Athopia",
    description: "Transferrykten med status: ryktas, rapporteras, bekräftat eller dementerat.",
  };
}

const GROUP_ORDER: { status: RumorStatus; label: string; hint: string }[] = [
  { status: "bekraftat", label: "Bekräftat", hint: "Hög konfidens — flera oberoende signaler." },
  { status: "rapporteras", label: "Rapporteras", hint: "Rapporterat av källor, ej officiellt bekräftat." },
  { status: "ryktas", label: "Ryktas", hint: "Tidigt läge — låg konfidens." },
  { status: "dementerat", label: "Dementerat", hint: "Klubb eller spelare har förnekat ryktet." },
];

const STATUS_BADGE_CLASS: Record<RumorStatus, string> = {
  bekraftat: "bg-success-muted text-success",
  rapporteras: "bg-pitch-muted text-pitch",
  ryktas: "bg-muted text-muted-foreground",
  dementerat: "bg-destructive/10 text-destructive",
};

function relTime(iso: string | null): string {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600_000);
  if (h < 1) return "just nu";
  if (h < 24) return `${h} tim`;
  return `${Math.round(h / 24)} d`;
}

function RumorRow({ item }: { item: RumorRadarItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug text-foreground line-clamp-2">
            {item.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            {item.sourceName ?? "Okänd källa"}
            {item.sourceCount >= 2 ? ` · ${item.sourceCount} källor` : ""}
            {" · "}
            {Math.round(item.confidence * 100)}% konfidens
            {" · "}
            {relTime(item.publishedAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function RumorGroup({
  status,
  label,
  hint,
  items,
}: {
  status: RumorStatus;
  label: string;
  hint: string;
  items: RumorRadarItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={label}>
      <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[status]}`}
          >
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{items.length}</span>
      </div>
      <ul className="divide-y divide-border/50">
        {items.map((item, i) => (
          <RumorRow key={`${item.href}-${i}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

export default async function RyktenPage() {
  if (!isRumorRadarEnabled()) {
    notFound();
  }

  let groups;
  let loadError = false;
  try {
    groups = await getRumorRadar();
  } catch {
    loadError = true;
    groups = { bekraftat: [], rapporteras: [], ryktas: [], dementerat: [] };
  }

  const total = GROUP_ORDER.reduce((sum, g) => sum + groups[g.status].length, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Ryktesradar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Transferrykten grupperade efter signalstyrka — ryktas, rapporteras, bekräftat, dementerat.
      </p>

      <div className="mt-6 space-y-4">
        {loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
            Kunde inte hämta rykten just nu. Försök igen senare.
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Inga rykten med tillräcklig signal just nu.
          </div>
        ) : (
          GROUP_ORDER.map((g) => (
            <RumorGroup key={g.status} status={g.status} label={g.label} hint={g.hint} items={groups[g.status]} />
          ))
        )}
      </div>
    </main>
  );
}
