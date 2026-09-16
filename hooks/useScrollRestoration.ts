"use client";

import { useEffect, useRef } from "react";

const PREFIX = "athopia.scroll:";
/** Äldre positioner än detta är inte "samma session" i praktiken. */
const MAX_AGE_MS = 30 * 60 * 1000;

interface Stored {
  y: number;
  at: number;
}

function read(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return typeof parsed.y === "number" ? parsed.y : null;
  } catch {
    return null;
  }
}

/**
 * Bevarar och återställer scrollpositionen i ett flöde (mobil UX-regel 16).
 *
 * Next Apps egen scroll-restore räcker inte för klientladdade listor: vid
 * tillbaka-navigering är bara första sidan renderad, dokumentet är kortare än
 * det var, och webbläsaren klampar positionen till botten av det korta
 * dokumentet. Därför väntar vi på `ready` — att innehållet faktiskt finns —
 * och återställer då, exakt en gång.
 *
 * @param key   Stabil nyckel per lista (route + filter), inte per render.
 * @param ready Sant när så mycket innehåll är monterat att positionen finns.
 */
export function useScrollRestoration(key: string, ready: boolean): void {
  const restored = useRef(false);
  const target = useRef<number | null>(null);

  // Läs målet innan något hunnit scrolla över det.
  useEffect(() => {
    restored.current = false;
    target.current = read(key);
  }, [key]);

  useEffect(() => {
    let frame = 0;
    function save() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          const value: Stored = { y: window.scrollY, at: Date.now() };
          sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch {
          // Privat läge / full kvot: att tappa positionen är inte värt ett krasch.
        }
      });
    }
    window.addEventListener("scroll", save, { passive: true });
    // pagehide täcker iOS Safari, där unload inte alltid fyrar.
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [key]);

  useEffect(() => {
    if (!ready || restored.current) return;
    const y = target.current;
    if (y === null || y <= 0) {
      restored.current = true;
      return;
    }
    // Två frames: en för layout av det nymonterade innehållet, en för att
    // positionen ska gå att nå innan vi ger upp.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (document.documentElement.scrollHeight >= y) {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          restored.current = true;
        }
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [ready]);
}
