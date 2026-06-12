"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { motion, useAnimation } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;

interface PullToRefreshProps {
  /** Async refresh — spinnern snurrar tills promisen resolvar */
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

/**
 * Touch-driven pull-to-refresh. Aktiveras bara när närmaste scrollbara
 * förälder står på toppen. Gummiband-motstånd + spring tillbaka.
 */
export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimation();

  function atTop(): boolean {
    let el: HTMLElement | null = containerRef.current;
    while (el) {
      if (el.scrollHeight > el.clientHeight) return el.scrollTop <= 0;
      el = el.parentElement;
    }
    return (window.scrollY ?? 0) <= 0;
  }

  function onTouchStart(e: TouchEvent) {
    if (refreshing || !atTop()) return;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // Gummiband: avtagande motstånd ju längre man drar
    const damped = Math.min(MAX_PULL, delta * 0.5);
    setPull(damped);
    controls.set({ y: damped });
  }

  async function onTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;

    if (pull >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      controls.start({ y: PULL_THRESHOLD * 0.8, transition: transitions.gentle });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        controls.start({ y: 0, transition: transitions.gentle });
        setPull(0);
      }
    } else {
      controls.start({ y: 0, transition: transitions.gentle });
      setPull(0);
    }
  }

  const progress = Math.min(1, pull / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden overscroll-y-contain", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        aria-hidden={!refreshing}
        className="pointer-events-none absolute inset-x-0 top-0 flex h-16 items-center justify-center"
      >
        <Loader2
          className={cn(
            "size-5 text-muted-foreground transition-opacity",
            refreshing && "animate-spin"
          )}
          style={{
            opacity: refreshing ? 1 : progress,
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
          }}
        />
      </div>
      <motion.div animate={controls} initial={{ y: 0 }}>
        {children}
      </motion.div>
    </div>
  );
}
