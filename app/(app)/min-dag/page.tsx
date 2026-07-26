/**
 * Slice 3 P1 — "Personlig Daily": /min-dag, a time-boxed personal reading
 * brief. Behind PERSONLIG_DAILY flag (see isPersonligDailyEnabled), OFF by
 * default so prod is unchanged. No nav entry — direct link only.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Clock } from "lucide-react";
import { isPersonligDailyEnabled } from "@/lib/daily/isPersonligDailyEnabled";
import { getPersonalDaily } from "@/lib/daily/personal-daily";

export const revalidate = 60;

const MINUTE_OPTIONS = [3, 5, 7] as const;
type Minutes = (typeof MINUTE_OPTIONS)[number];

function parseMinutes(raw: string | undefined): Minutes {
  const n = Number(raw);
  return (MINUTE_OPTIONS as readonly number[]).includes(n) ? (n as Minutes) : 5;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Min dag | Athopia",
    description:
      "Din personliga läsbrief — mitt lag, dagens match och det som betyder något, på så lång tid du har.",
  };
}

export default async function MinDagPage({
  searchParams,
}: {
  searchParams: Promise<{ min?: string }>;
}) {
  if (!isPersonligDailyEnabled()) notFound();

  const { userId } = await auth();
  const { min } = await searchParams;
  const minutes = parseMinutes(min);

  const brief = userId ? await getPersonalDaily(userId, minutes) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Min dag
        </h1>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <div className="flex gap-1.5">
            {MINUTE_OPTIONS.map((m) => (
              <Link
                key={m}
                href={`/min-dag?min=${m}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  m === minutes
                    ? "bg-pitch text-white"
                    : "border border-border text-foreground hover:bg-muted/40"
                }`}
              >
                {m} min
              </Link>
            ))}
          </div>
        </div>
      </header>

      {!brief || brief.isEmpty ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Inget för din dag än — följ ett lag för en personlig sammanfattning.
          </p>
          <Link
            href="/mitt-lag"
            className="mt-4 inline-block rounded-full bg-pitch px-4 py-2 text-sm font-medium text-white hover:bg-pitch/90"
          >
            Välj favoritlag
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {brief.sections.map((section) => (
            <section key={section.key} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-3 space-y-3">
                {section.items.map((it) => (
                  <li key={it.id}>
                    <Link href={it.href} className="block hover:underline">
                      <p className="text-sm font-medium text-foreground">{it.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {it.sourceName ? `${it.sourceName} · ` : ""}
                        {new Date(it.publishedAt).toLocaleString("sv-SE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
