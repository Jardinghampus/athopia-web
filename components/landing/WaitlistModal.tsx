"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, CheckCircle2, Lock, ChevronLeft } from "lucide-react";

const ACCESS_CODE = "Hampus2026";
const ACCESS_KEY = "athopia_access";

export function useWaitlistAccess() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ACCESS_KEY) === "1";
}

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

type View = "choice" | "code" | "waitlist" | "done";

export function WaitlistModal({ open, onClose, redirectTo = "/onboarding" }: WaitlistModalProps) {
  const [view, setView] = useState<View>("choice");
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [fading, setFading] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Cross-fade when switching views
  const goTo = useCallback((next: View) => {
    setFading(true);
    setPendingView(next);
  }, []);

  useEffect(() => {
    if (!fading || !pendingView) return;
    const t = setTimeout(() => {
      setView(pendingView);
      setPendingView(null);
      setFading(false);
    }, 130);
    return () => clearTimeout(t);
  }, [fading, pendingView]);

  // Reset view when modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setView("choice");
        setCode(""); setCodeError(""); setName(""); setEmail(""); setTeam(""); setFormError("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      localStorage.setItem(ACCESS_KEY, "1");
      window.location.href = redirectTo;
    } else {
      setCodeError("Fel kod. Försök igen.");
    }
  }

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, favorite_team: team }),
      });
      if (!res.ok) throw new Error();
      goTo("done");
    } catch {
      setFormError("Något gick fel. Försök igen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Keyframe definitions */}
      <style>{`
        @keyframes wl-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wl-card {
          from { opacity: 0; transform: scale(0.95) translateY(8px) }
          to   { opacity: 1; transform: scale(1)    translateY(0)   }
        }
        @keyframes wl-check {
          0%   { opacity: 0; transform: scale(0.5) }
          70%  { transform: scale(1.12) }
          100% { opacity: 1; transform: scale(1) }
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-card, .wl-check { animation: none !important; opacity: 1 !important; transform: none !important; }
          .wl-backdrop { animation: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="wl-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        style={{ animation: "wl-backdrop 200ms ease forwards" }}
      >
        <div
          className="absolute inset-0 bg-black/72 backdrop-blur-[6px]"
          onClick={onClose}
        />

        {/* Card */}
        <div
          className="wl-card relative z-10 w-full max-w-[440px] overflow-hidden rounded-[28px] shadow-2xl"
          style={{
            animation: "wl-card 280ms cubic-bezier(0.23,1,0.32,1) forwards",
            background: "linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Ambient glow top */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(214,31,31,0.5), transparent)" }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/25 transition-all duration-[160ms] ease-out hover:bg-white/8 hover:text-white/50 active:scale-[0.92]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content panel — fades between views */}
          <div
            className="px-8 py-8 transition-opacity duration-[130ms] ease-out"
            style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(4px)" : "translateY(0)", transition: "opacity 130ms ease-out, transform 130ms ease-out" }}
          >
            {view === "choice" && (
              <div className="text-center">
                {/* Beta pill */}
                <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pitch" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-pitch">Privat beta</span>
                </div>

                <h2 className="mb-3 font-heading text-[2.6rem] leading-[1.0] tracking-wide text-white">
                  Snart live.
                </h2>
                <p className="mb-8 text-[15px] leading-[1.65] text-white/45">
                  Athopia är i privat beta just nu. Anmäl ditt intresse så
                  hör vi av oss — eller ange din kod om du redan fått en.
                </p>

                <div className="flex flex-col gap-2.5">
                  <Btn primary onClick={() => goTo("waitlist")}>
                    Anmäl mitt intresse <ArrowRight className="h-4 w-4" />
                  </Btn>
                  <Btn onClick={() => goTo("code")}>
                    <Lock className="h-3.5 w-3.5 opacity-60" /> Jag har en kod
                  </Btn>
                </div>
              </div>
            )}

            {view === "code" && (
              <div>
                <BackBtn onClick={() => goTo("choice")} />
                <h2 className="mb-1 font-heading text-[2rem] tracking-wide text-white">Tillgångskod</h2>
                <p className="mb-6 text-sm text-white/40">Ange din privata kod för att låsa upp.</p>
                <form onSubmit={handleCodeSubmit} className="flex flex-col gap-2.5">
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Din kod"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                  />
                  {codeError && (
                    <p className="text-[13px] text-red-400/90">{codeError}</p>
                  )}
                  <Btn primary type="submit">Lås upp</Btn>
                </form>
              </div>
            )}

            {view === "waitlist" && (
              <div>
                <BackBtn onClick={() => goTo("choice")} />
                <h2 className="mb-1 font-heading text-[2rem] tracking-wide text-white">Anmäl intresse</h2>
                <p className="mb-6 text-sm text-white/40">Vi hör av oss när du kan komma in.</p>
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-2.5">
                  <Input required autoFocus type="text" placeholder="Ditt namn" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input required type="email" placeholder="E-postadress" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input type="text" placeholder="Favoritlag (valfritt)" value={team} onChange={(e) => setTeam(e.target.value)} />
                  {formError && <p className="text-[13px] text-red-400/90">{formError}</p>}
                  <Btn primary type="submit" disabled={submitting}>
                    {submitting ? <Spinner /> : "Anmäl mig"}
                  </Btn>
                </form>
              </div>
            )}

            {view === "done" && (
              <div className="py-4 text-center">
                <div
                  className="wl-check mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pitch/15"
                  style={{ animation: "wl-check 400ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}
                >
                  <CheckCircle2 className="h-8 w-8 text-pitch" />
                </div>
                <h2 className="mb-2 font-heading text-[2rem] tracking-wide text-white">Du är med!</h2>
                <p className="mb-8 text-[15px] leading-[1.65] text-white/45">
                  Vi hör av oss till{" "}
                  <span className="font-medium text-white/75">{email}</span>{" "}
                  när det är din tur.
                </p>
                <Btn onClick={onClose}>Stäng</Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Btn({
  children, primary, onClick, type = "button", disabled,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold",
        "transition-[transform,opacity] duration-[160ms] ease-out active:scale-[0.97]",
        primary
          ? "bg-pitch text-white hover:opacity-90 disabled:opacity-50"
          : "border border-white/[0.12] text-white/60 hover:border-white/25 hover:text-white/80",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 flex items-center gap-1.5 text-[13px] text-white/35 transition-colors duration-[160ms] hover:text-white/60 active:scale-[0.97]"
    >
      <ChevronLeft className="h-3.5 w-3.5" /> Tillbaka
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white placeholder-white/20 outline-none transition-all duration-[160ms] ease-out focus:border-pitch/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-pitch/20"
    />
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
