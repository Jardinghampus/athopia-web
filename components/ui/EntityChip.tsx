"use client";

/**
 * EntityChip
 * Klickbar tag för lag/spelare/tävling som navigerar till /lag/[slug]
 * eller /spelare/[slug] baserat på entity.type.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Entity } from "@/lib/supabase";

const typeRoute: Record<Entity["type"], string> = {
  team: "/lag",
  player: "/spelare",
  competition: "/liga",
  person: "/person",
};

const typeColor: Record<Entity["type"], string> = {
  team: "bg-pitch/20 text-pitch-light border-pitch/30 hover:bg-pitch/30",
  player: "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20",
  competition: "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20",
  person: "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20",
};

interface EntityChipProps {
  entity: Entity;
  className?: string;
  /** Klick avaktiveras – används i statisk lista utan navigering */
  static?: boolean;
}

export function EntityChip({ entity, className, static: isStatic }: EntityChipProps) {
  const classes = cn(
    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
    "text-xs font-medium border transition-colors duration-150",
    "cursor-pointer select-none",
    typeColor[entity.type],
    className
  );

  if (isStatic) {
    return <span className={classes}>{entity.name}</span>;
  }

  return (
    <Link
      href={`${typeRoute[entity.type]}/${entity.slug}`}
      className={classes}
      aria-label={`Visa ${entity.name}`}
    >
      {entity.name}
    </Link>
  );
}
