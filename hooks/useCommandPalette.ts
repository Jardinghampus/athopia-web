"use client";

import { useCallback, useEffect, useState } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const hasMod = e.metaKey || e.ctrlKey;
      if (hasMod && isK) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Hooken är lokal useState per anropare (ingen delad context) — komponenter
  // som inte själva monterar <CommandPalette/> (GlassNav, Header) måste öppna
  // den via detta globala event i stället för att ropa openPalette() på sin
  // egen, orenderade instans.
  useEffect(() => {
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("athopia:open-search", onOpenEvent);
    return () => window.removeEventListener("athopia:open-search", onOpenEvent);
  }, []);

  return { open, setOpen, toggle, close, openPalette, query, setQuery };
}

