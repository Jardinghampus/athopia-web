import Image from "next/image";
import {
  BRAND_ASSETS,
  BRAND_BADGE_LABELS,
  type BrandBadgeKind,
} from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: 16,
  md: 20,
  lg: 28,
} as const;

export function BrandBadge({
  kind,
  size = "md",
  className,
  title,
}: {
  kind: BrandBadgeKind;
  size?: keyof typeof SIZES | number;
  className?: string;
  title?: string;
}) {
  const px = typeof size === "number" ? size : SIZES[size];
  const label = title ?? BRAND_BADGE_LABELS[kind];
  return (
    <Image
      src={BRAND_ASSETS[kind]}
      alt={label}
      title={label}
      width={px}
      height={px}
      className={cn("inline-block shrink-0 object-contain", className)}
      unoptimized
    />
  );
}

/** Avatar-hörn: writer for krönikör/admin, full badge (ingen extra pitch-cirkel). */
export function AvatarWriterBadge({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-7";
  const ring = size === "lg" ? "ring-[3px]" : "ring-2";
  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 overflow-hidden rounded-full bg-background",
        box,
        ring,
        "ring-background",
        className,
      )}
      aria-label={BRAND_BADGE_LABELS.writer}
      title={BRAND_BADGE_LABELS.writer}
    >
      <BrandBadge kind="writer" size={size === "sm" ? 16 : size === "md" ? 20 : 28} className="size-full" />
    </span>
  );
}
