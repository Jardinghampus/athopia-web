"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ProfileCard, type PublicProfile } from "./ProfileCard";

// Enkel modul-cache så samma profil inte hämtas om vid varje öppning
const cache = new Map<string, PublicProfile | null>();

function ProfilePopup({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(
    cache.has(userId) ? cache.get(userId) : undefined
  );

  useEffect(() => {
    if (cache.has(userId)) return;
    let cancelled = false;
    void fetch(`/api/profile/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicProfile | null) => {
        if (cancelled) return;
        cache.set(userId, data);
        setProfile(data);
      })
      .catch(() => !cancelled && setProfile(null));
    return () => { cancelled = true; };
  }, [userId]);

  // Esc stänger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />

        {/* Kort */}
        <motion.div
          className="relative w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-muted-foreground shadow-md hover:text-foreground transition-colors"
            aria-label="Stäng"
          >
            <X className="h-4 w-4" />
          </button>

          {profile === undefined ? (
            <div className="h-72 rounded-3xl border border-border bg-card skeleton-wave" />
          ) : profile === null ? (
            <div className="flex h-48 items-center justify-center rounded-3xl border border-border bg-card text-sm text-muted-foreground">
              Profilen kunde inte hämtas.
            </div>
          ) : (
            <ProfileCard profile={profile} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/**
 * Wrappa författarnamn/avatar i forum med denna — öppnar profilkort-popup vid klick.
 */
export function ProfileLink({
  userId,
  children,
  className,
}: {
  userId: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handle = useCallback(
    (e: React.MouseEvent) => {
      if (!userId) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
    [userId]
  );

  if (!userId) return <>{children}</>;

  return (
    <>
      <button type="button" onClick={handle} className={className}>
        {children}
      </button>
      {mounted && open && <ProfilePopup userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}
