"use client";

import { useState } from "react";
import { X, ArrowRight, CheckCircle2, Lock } from "lucide-react";

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
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

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
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, favorite_team: team }),
      });
      if (!res.ok) throw new Error();
      setView("done");
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setView("choice");
    setCode("");
    setCodeError("");
    setName("");
    setEmail("");
    setTeam("");
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      onClick={(e) => e.target === e.currentTarget && reset()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={reset} />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <button
          onClick={reset}
          className="absolute right-4 top-4 rounded-xl p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          <X className="h-5 w-5" />
        </button>

        {view === "choice" && (
          <div className="text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-pitch">Athopia Beta</div>
            <h2 className="mb-2 font-heading text-4xl leading-tight tracking-wide text-white">
              Kommer snart.
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-white/50">
              Athopia är i privat beta. Du kan anmäla intresse eller ange din
              tillgångskod om du fått en.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setView("waitlist")}
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-pitch px-6 text-[16px] font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]"
              >
                Anmäl mitt intresse <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("code")}
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 text-[16px] text-white/70 transition-all hover:border-white/30 hover:text-white active:scale-[0.97]"
              >
                <Lock className="h-4 w-4" /> Ange tillgångskod
              </button>
            </div>
          </div>
        )}

        {view === "code" && (
          <div>
            <button onClick={() => setView("choice")} className="mb-6 text-sm text-white/40 hover:text-white/60">← Tillbaka</button>
            <h2 className="mb-1 font-heading text-3xl tracking-wide text-white">Tillgångskod</h2>
            <p className="mb-6 text-sm text-white/40">Ange din privata kod för att få tillgång.</p>
            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Din kod"
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/25 outline-none focus:border-pitch/60 focus:ring-1 focus:ring-pitch/30"
              />
              {codeError && <p className="text-sm text-red-400">{codeError}</p>}
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-pitch text-[15px] font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]"
              >
                Lås upp
              </button>
            </form>
          </div>
        )}

        {view === "waitlist" && (
          <div>
            <button onClick={() => setView("choice")} className="mb-6 text-sm text-white/40 hover:text-white/60">← Tillbaka</button>
            <h2 className="mb-1 font-heading text-3xl tracking-wide text-white">Anmäl intresse</h2>
            <p className="mb-6 text-sm text-white/40">Vi hör av oss när du kan komma in.</p>
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
              <input
                required
                type="text"
                placeholder="Ditt namn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/25 outline-none focus:border-pitch/60 focus:ring-1 focus:ring-pitch/30"
              />
              <input
                required
                type="email"
                placeholder="Din e-post"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/25 outline-none focus:border-pitch/60 focus:ring-1 focus:ring-pitch/30"
              />
              <input
                type="text"
                placeholder="Favorit­lag (valfritt)"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/25 outline-none focus:border-pitch/60 focus:ring-1 focus:ring-pitch/30"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-xl bg-pitch text-[15px] font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
              >
                {submitting ? "Skickar…" : "Anmäl mig"}
              </button>
            </form>
          </div>
        )}

        {view === "done" && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-pitch" />
            <h2 className="mb-2 font-heading text-3xl tracking-wide text-white">Du är med!</h2>
            <p className="mb-6 text-[15px] text-white/50">
              Vi hör av oss till <span className="text-white/80">{email}</span> när det
              är din tur. Tack för ditt intresse!
            </p>
            <button
              onClick={reset}
              className="h-12 w-full rounded-xl border border-white/15 text-[15px] text-white/60 transition-all hover:border-white/30 hover:text-white"
            >
              Stäng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
