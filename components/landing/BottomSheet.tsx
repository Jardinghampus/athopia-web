"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { project } from "@/lib/gesture";

/* Native-känsla: bottom sheet med drag-handle och drag-to-dismiss.
   Ersätter centrerade modaler på mobil. Respekterar safe-area längst ner. */

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  // Hastigheten vid släpp lämnas över till exit-springen (§5 velocity handoff).
  // State, inte ref: transition-propen läses under render, och en ref som läses
  // där är både lint-fel och skört — värdet skulle kunna vara en render gammalt
  // precis när det måste vara färskt. setState + onClose i samma handler
  // batchas, så exit-renderingen ser hastigheten.
  const [releaseVelocity, setReleaseVelocity] = useState(0);

  // Escape, scroll-lås, fokusfälla och fokusåterlämning.
  const sheetRef = useModalA11y<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={sheetRef}
          tabIndex={-1}
          className="fixed inset-0 z-[60] focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            type="button"
            aria-label="Stäng"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white/10 bg-[#111312] pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-24px_64px_rgba(0,0,0,0.5)]"
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            // damping ~0.8 (sheet-tabellen), inte kritiskt dämpad: gesten bär
            // momentum, så en aning översläng är rätt. releaseVelocity gör att
            // utgången fortsätter i fingrets hastighet — ingen söm mellan drag
            // och animation.
            transition={{ type: "spring", stiffness: 360, damping: 30, velocity: releaseVelocity }}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              setReleaseVelocity(info.velocity.y);
              // Projicerad viloposition, inte råa offseten: en snärt stänger
              // även om fingret bara hann 30 px.
              if (info.offset.y + project(info.velocity.y) > 96) onClose();
            }}
          >
            {/* Drag-handle */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            {/* X i hörnet — handtaget visar att man kan svepa, men gesten är
                inte den enda vägen ut (mobil UX-regel 11). */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng"
              className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
            <div className="px-5 pb-2 pr-16">
              <h2 className="font-heading text-2xl text-white text-balance">{title}</h2>
            </div>
            <div className="max-h-[70dvh] overflow-y-auto px-5 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
