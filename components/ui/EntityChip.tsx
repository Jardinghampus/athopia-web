/**
 * EntityChip
 * Klickbar tag för lag/spelare/tränare.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Entity } from "@/lib/types";

const typeColor: Record<Entity["type"], string> = {
  team: "bg-pitch/20 text-pitch-light border-pitch/30 hover:bg-pitch/30",
  player: "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20",
  coach: "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20",
};

interface EntityChipProps {
  entity: Entity;
  className?: string;
  size?: "sm" | "md";
  linked?: boolean;
}

export function EntityChip({
  entity,
  className,
  size = "md",
  linked = true,
}: EntityChipProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  const classes = cn(
    "inline-flex items-center gap-1 rounded-full font-medium border transition-colors duration-150 select-none",
    sizeClasses,
    typeColor[entity.type],
    className
  );

  const href =
    entity.type === "team"
      ? `/lag/${entity.slug}`
      : entity.type === "player"
      ? `/spelare/${entity.slug}`
      : `/coach/${entity.slug}`;

  if (!linked) return <span className={classes}>{entity.name}</span>;

  return (
    <Link href={href} className={cn(classes, "hover:bg-opacity-100")} aria-label={`Visa ${entity.name}`}>
      {entity.name}
    </Link>
  );
}
