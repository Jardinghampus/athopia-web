/**
 * TransferRadar — ryktesradar med Rykte / Bekräftad (multi-source).
 * PRO-gated via BlurPaywall: free får bara titlar i preview, aldrig statusdetalj.
 */

import Link from "next/link";
import type { Plan } from "@/lib/access-rules";
import { BlurPaywall } from "@/components/BlurPaywall";
import {
  transferStatusBadgeClass,
} from "@/lib/transfer-status";
import { getTransferRadar } from "@/lib/team-hub/transfers";

function relTime(iso: string | null): string {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600_000);
  if (h < 1) return "just nu";
  if (h < 24) return `${h} tim`;
  return `${Math.round(h / 24)} d`;
}

function RadarList({ items }: { items: Awaited<ReturnType<typeof getTransferRadar>> }) {
  return (
    <ul className="divide-y divide-border/50">
      {items.map((it) => (
        <li key={it.id}>
          <Link
            href={it.slug ? `/artikel/${it.slug}` : "/prenumerera"}
            className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20"
          >
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${transferStatusBadgeClass(it.status)}`}
            >
              {it.label}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug text-foreground line-clamp-2">
                {it.title}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {it.sourceName ?? "Okänd källa"}
                {it.sourceCount >= 2 ? ` · ${it.sourceCount} källor` : ""}
                {" · "}
                {relTime(it.publishedAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function TransferRadar({
  teamSlug,
  plan,
  teamName,
}: {
  teamSlug: string;
  plan: Plan;
  teamName?: string;
}) {
  const items = await getTransferRadar(teamSlug);
  if (items.length === 0) return null;

  const confirmed = items.filter((i) => i.status === "bekraftad").length;

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6" aria-label="Ryktesradarn">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Ryktesradarn
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rykte / Bekräftad
          </span>
        </div>

        <BlurPaywall
          feature="transferSignals"
          plan={plan}
          teamName={teamName}
          className="rounded-none border-0"
          maxHeight="7.5rem"
          tease={`${items.length} transfer-signaler${confirmed ? ` · ${confirmed} bekräftade` : ""} — se status innan kollegorna.`}
          preview={
            <ul className="space-y-2">
              {items.slice(0, 4).map((it) => (
                <li key={it.id} className="text-sm text-foreground line-clamp-1">
                  {it.title}
                </li>
              ))}
            </ul>
          }
        >
          <RadarList items={items} />
          <div className="border-t border-border/50 px-4 py-2.5">
            <Link href="/nyheter/transferer" className="text-xs text-pitch hover:underline">
              Alla transfers →
            </Link>
          </div>
        </BlurPaywall>
      </div>
    </section>
  );
}
