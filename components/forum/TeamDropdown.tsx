"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Team {
  slug: string;
  name: string;
}

interface Props {
  teams: Team[];
  currentSlug: string;
}

export default function TeamDropdown({ teams, currentSlug }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = teams.find((t) => t.slug === currentSlug);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-pitch/50 transition-colors touch-manipulation"
      >
        <span>Byt lag</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-border/60 bg-popover shadow-lg shadow-black/30 overflow-hidden"
          >
            <div className="max-h-72 overflow-y-auto overscroll-contain py-1">
              {teams.map((team) => (
                <Link
                  key={team.slug}
                  href={`/forum/${team.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    team.slug === currentSlug
                      ? "text-pitch font-medium bg-pitch/5"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  {team.name}
                  {team.slug === currentSlug && (
                    <Check className="w-3.5 h-3.5 text-pitch shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
