"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getStoredConsent,
  storeConsent,
  applyConsent,
  type CookieConsent,
} from "@/lib/cookieConsent";

async function persistToServer(consent: CookieConsent) {
  try {
    await fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(consent),
    });
  } catch {
    // tyst — localStorage-versionen är redan sparad
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);
  }, []);

  function save(opts: { analytics: boolean; marketing: boolean }) {
    const consent = storeConsent({ necessary: true, ...opts });
    applyConsent(consent);
    persistToServer(consent);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Cookie-inställningar"
          aria-modal="false"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 38, mass: 0.9 }}
          className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-md"
        >
          <p className="text-sm font-semibold text-white">Vi använder cookies</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Nödvändiga cookies används alltid. Du kan tillåta analytics och
            marknadsföring nedan.{" "}
            <a
              href="/integritetspolicy"
              className="underline underline-offset-2 hover:text-white"
            >
              Läs mer
            </a>
            .
          </p>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                  <Toggle
                    id="cc-necessary"
                    label="Nödvändiga"
                    description="Auth, session, Stripe. Kan inte stängas av."
                    checked={true}
                    disabled
                    onChange={() => {}}
                  />
                  <Toggle
                    id="cc-analytics"
                    label="Analytics"
                    description="Hjälper oss förstå hur sajten används (anonymt)."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <Toggle
                    id="cc-marketing"
                    label="Marknadsföring"
                    description="Relevanta annonser och retargeting."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => save({ analytics: true, marketing: true })}
              className="flex-1 rounded-xl bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18876A] active:scale-[0.97]"
            >
              Godkänn alla
            </button>
            <button
              onClick={() => save({ analytics, marketing })}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white active:scale-[0.97]"
            >
              {showDetails ? "Spara val" : "Avvisa"}
            </button>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="w-full rounded-xl px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showDetails ? "Dölj inställningar ↑" : "Anpassa inställningar ↓"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-white">{label}</p>
        <p className="text-[11px] leading-snug text-zinc-500">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-[#1D9E75]" : "bg-zinc-700",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
