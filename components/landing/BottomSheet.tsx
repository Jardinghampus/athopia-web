"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
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
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 600) onClose();
            }}
          >
            {/* Drag-handle */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-2">
              <h2 className="font-heading text-2xl tracking-wider text-white">{title}</h2>
            </div>
            <div className="max-h-[70dvh] overflow-y-auto px-5 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
