"use client";

import type { ReactNode } from "react";

/* Realistisk iPhone-ram. Skärminnehållet byggs som riktiga Tailwind-komponenter
   (inga bilder). Hela ramen är dekorativ: aria-hidden + select-none.
   Inre skärm 260×564 ≈ 19,5:9 — bygger på 4px-grid. */

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div aria-hidden className={`relative select-none ${className}`}>
      {/* Sidoknappar */}
      <div className="absolute -left-[2px] top-[112px] h-7 w-[3px] rounded-l bg-zinc-700" />
      <div className="absolute -left-[2px] top-[152px] h-12 w-[3px] rounded-l bg-zinc-700" />
      <div className="absolute -right-[2px] top-[136px] h-16 w-[3px] rounded-r bg-zinc-700" />

      {/* Bezel */}
      <div className="relative rounded-[52px] bg-zinc-950 p-[10px] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/15">
        {/* Skärm */}
        <div className="relative h-[564px] w-[260px] overflow-hidden rounded-[42px] bg-[#F2F3F1] text-zinc-900">
          {children}

          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[10px] h-6 w-[84px] -translate-x-1/2 rounded-full bg-black" />
          {/* Home-indikator */}
          <div className="absolute bottom-[6px] left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-black/70" />
        </div>
      </div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pb-1 pt-[15px] text-zinc-900">
      <span className="w-10 text-[12px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-[5px]">
        {/* Mottagning */}
        <div className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h) => (
            <div key={h} className="w-[3px] rounded-[1px] bg-zinc-900" style={{ height: h }} />
          ))}
        </div>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 9.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" transform="translate(0 -1.6)" />
          <path
            d="M7.5 5.6c1.5 0 2.9.6 3.9 1.6l-1.2 1.2a4 4 0 0 0-5.4 0L3.6 7.2a5.6 5.6 0 0 1 3.9-1.6Z"
            opacity="0.95"
          />
          <path
            d="M7.5 2c2.5 0 4.8 1 6.5 2.6l-1.2 1.2A7.6 7.6 0 0 0 7.5 3.6c-2 0-3.9.8-5.3 2.2L1 4.6A9.2 9.2 0 0 1 7.5 2Z"
            opacity="0.95"
          />
        </svg>
        {/* Batteri */}
        <div className="flex items-center gap-[2px]">
          <div className="flex h-[11px] w-[22px] items-center rounded-[3px] border border-zinc-900/40 p-[1.5px]">
            <div className="h-full w-[70%] rounded-[1.5px] bg-zinc-900" />
          </div>
          <div className="h-[4px] w-[1.5px] rounded-r bg-zinc-900/40" />
        </div>
      </div>
    </div>
  );
}
