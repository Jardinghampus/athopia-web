"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  children: ReactNode;
  /** Tailwind-bredd per slide, t.ex. "w-72" eller "w-[80%]" */
  slideClassName?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Horisontell snap-karusell (embla) för sektioner med många kort.
 * Drag med pekare/touch, momentum, snap per kort. Tar emot server-renderade
 * children (en slide per barn). Använd bara där en grid/lista inte räcker —
 * karusell döljer innehåll och ska vara ett medvetet val.
 */
export function Carousel({
  children,
  slideClassName = "w-72",
  className,
  "aria-label": ariaLabel,
}: CarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    skipSnaps: false,
    dragFree: false,
  });

  return (
    <div
      ref={emblaRef}
      role="region"
      aria-label={ariaLabel}
      className={cn("overflow-hidden touch-pan-y", className)}
    >
      <div className="flex gap-3">
        {Children.map(children, (child) => (
          <div className={cn("min-w-0 shrink-0", slideClassName)}>{child}</div>
        ))}
      </div>
    </div>
  );
}
