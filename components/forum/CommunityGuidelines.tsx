"use client";

import { useState } from "react";
import { Shield, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const RULES = [
  "Håll en respektfull ton — alla supportrar är välkomna oavsett lag",
  "Inga personangrepp, trakasserier eller hatretorik",
  "Håll diskussionen relevant till lag, matcher och fotboll",
  "Märk tydligt när något är ett rykte, inte ett faktum",
  "Använd rapportera-knappen om du ser regelbrott",
];

export default function CommunityGuidelines() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left touch-manipulation"
      >
        <Shield className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
        <span className="flex-1 text-xs font-medium text-muted-foreground/70">
          Community-regler
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rules"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-4 pt-1 space-y-2 border-t border-border/30">
              {RULES.map((rule, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="text-pitch mt-0.5 shrink-0">·</span>
                  {rule}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
