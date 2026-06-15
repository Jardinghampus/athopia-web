"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

export function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-pitch-light" />,
  title = "Nyhet",
  description = "Senaste från Allsvenskan",
  date = "Just nu",
  titleClassName = "text-pitch",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[19rem] sm:w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-zinc-950 after:to-transparent after:content-[''] hover:border-white/20 hover:bg-white/[0.08] [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-pitch/15 border border-pitch/25 p-1">
          {icon}
        </span>
        <p className={cn("text-sm font-semibold font-sans", titleClassName)}>{title}</p>
      </div>
      <p className="truncate text-base text-white/85">{description}</p>
      <p className="text-white/35 text-sm">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

const stackPositions = [
  "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-zinc-950/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  "[grid-area:stack] translate-x-8 translate-y-10 sm:translate-x-16 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-zinc-950/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  "[grid-area:stack] translate-x-16 translate-y-20 sm:translate-x-32 hover:translate-y-10",
];

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const displayCards = (cards ?? [{}, {}, {}]).slice(0, 3).map((card, i) => ({
    ...card,
    className: cn(stackPositions[i], card.className),
  }));

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
