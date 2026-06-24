"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  actor_name: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function notifText(n: Notification): string {
  const who = n.actor_name ?? "Någon";
  if (n.type === "reply") return `${who} svarade på ditt inlägg`;
  if (n.type === "like") return `${who} gillade ditt inlägg`;
  if (n.type === "repost") return `${who} repostade ditt inlägg`;
  return `${who} nämnde dig`;
}

export default function NotificationBell({ teamSlug }: { teamSlug: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    fetch("/api/forum/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.notifications ?? []))
      .catch(() => {});
  }, []);

  async function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/forum/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/forum/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
      >
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pitch border border-background" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border/60 bg-popover shadow-lg shadow-black/30 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <span className="text-sm font-semibold">Notifikationer</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-pitch hover:underline"
                  >
                    Markera alla lästa
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto overscroll-contain">
                {notifs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Inga notifikationer
                  </div>
                ) : (
                  notifs.map((n) => (
                    <Link
                      key={n.id}
                      href={n.post_id ? `/forum/${teamSlug}/${n.post_id}` : `/forum/${teamSlug}`}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors ${
                        !n.read ? "bg-pitch/5" : ""
                      }`}
                    >
                      {!n.read && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pitch shrink-0" />
                      )}
                      <div className={!n.read ? "" : "ml-4"}>
                        <p className="text-xs text-foreground leading-snug">{notifText(n)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
