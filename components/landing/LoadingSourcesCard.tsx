"use client";

import * as React from "react";
import Link from "next/link";
import { useAnimate, useReducedMotion } from "motion/react";
import { Sparkles, MoveRight } from "lucide-react";
import {
  HighlighterItem,
  HighlightGroup,
  Particles,
} from "@/components/ui/highlighter";

const SOURCES = [
  { id: "src-1", label: "Lokalpress", className: "right-12 top-10" },
  { id: "src-2", label: "Klubbkanaler", className: "left-2 top-20" },
  { id: "src-3", label: "Matchrapporter", className: "bottom-20 right-1" },
  { id: "src-4", label: "Poddar & forum", className: "bottom-12 left-14" },
];

/** Pekarens stopp (left, top) synkade med källornas positioner ovan */
const POINTER_PATH: [string, number, number][] = [
  ["#src-1", 200, 60],
  ["#src-2", 50, 102],
  ["#src-3", 224, 170],
  ["#src-4", 88, 198],
];

export function LoadingSourcesCard() {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (reducedMotion) return;
    animate(
      [
        ["#pointer", { left: 200, top: 60 }, { duration: 0 }],
        ...POINTER_PATH.flatMap(([id, left, top], i): [string, Record<string, number>, Record<string, unknown>][] => {
          const next = POINTER_PATH[(i + 1) % POINTER_PATH.length]!;
          return [
            [id, { opacity: 1 }, { duration: 0.3 }],
            [
              "#pointer",
              { left: next[1], top: next[2] },
              { at: "+0.5", duration: 0.5, ease: "easeInOut" },
            ],
            [id, { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
          ];
        }),
      ],
      { repeat: Number.POSITIVE_INFINITY }
    );
  }, [animate, reducedMotion]);

  return (
    <HighlightGroup className="group h-full">
      <div className="group/item h-full">
        <HighlighterItem className="rounded-3xl p-px">
          <div className="relative z-20 h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0C0C0C]">
            <Particles
              className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
              quantity={140}
              color="var(--color-pitch)"
              vy={-0.2}
            />
            <div className="flex justify-center">
              <div className="flex h-full flex-col justify-center gap-10 p-6 md:h-[320px] md:flex-row md:items-center">
                {/* Animationsyta: AI-pekaren besöker källorna */}
                <div className="relative mx-auto h-[270px] w-[300px] shrink-0" ref={scope}>
                  <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-pitch" />
                  {SOURCES.map(({ id, label, className }) => (
                    <div
                      key={id}
                      id={id}
                      className={`absolute rounded-3xl border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/80 opacity-50 ${className}`}
                    >
                      {label}
                    </div>
                  ))}

                  <div id="pointer" className="absolute">
                    <svg
                      width="16.8"
                      height="18.2"
                      viewBox="0 0 12 13"
                      className="fill-pitch"
                      stroke="white"
                      strokeWidth="1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676V5.50676Z"
                      />
                    </svg>
                    <span className="relative -top-1 left-3 rounded-3xl bg-pitch px-2 py-1 text-xs font-bold text-white">
                      Athopia AI
                    </span>
                  </div>
                </div>

                {/* AI-chatt: status + svar */}
                <div className="flex flex-col justify-center p-2 md:ml-6 md:w-[400px]">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch" />
                    </span>
                    Hämtar källor<span className="animate-pulse">…</span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="max-w-[340px] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/75">
                      Flera oberoende källor rapporterar samma nyhet. Jag klustrar,
                      verifierar och väger samman dem.
                    </div>
                    <div className="max-w-[340px] rounded-2xl rounded-tl-sm border border-pitch/25 bg-pitch/[0.07] px-4 py-3 text-sm leading-relaxed text-white/85">
                      Klart — en analys, skriven från helheten. Inte tio rubriker
                      som säger samma sak.
                    </div>
                  </div>

                  <Link
                    href="/onboarding"
                    className="mt-6 inline-flex w-fit min-h-12 items-center gap-2 rounded-xl bg-pitch px-6 py-3 text-sm font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                  >
                    Prova gratis <MoveRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </HighlighterItem>
      </div>
    </HighlightGroup>
  );
}
