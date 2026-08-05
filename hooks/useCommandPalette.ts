"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Delad state för sökdialogen.
 *
 * Tidigare hade varje anropare sin egen `useState`, vilket tvingade fram ett
 * globalt window-event: Header och GlassNav monterar inte själva
 * <CommandPalette/> och kunde därför inte öppna sin egen, orenderade instans.
 *
 * Den indirektionen hade ett hål. Dispatchen nådde bara en lyssnare som redan
 * hunnit monteras — klickade man mellan att Headern hydrerades och att
 * CommandPalette gjorde det, försvann klicket tyst. Med en modul-store finns
 * tillståndet oberoende av vem som råkar vara monterad: sätts det innan
 * dialogen monteras, läser den ut `true` redan i sin första snapshot och
 * öppnas direkt.
 *
 * Kvarstående begränsning: ett klick *före all* hydrering gör ingenting, för då
 * finns ingen onClick-handler alls. Det är inneboende i en klientrenderad
 * dialog och kan bara lösas genom att flytta öppet-läget till URL:en.
 */
type State = { open: boolean; query: string };

let state: State = { open: false, query: "" };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(next: Partial<State>) {
  const merged = { ...state, ...next };
  if (merged.open === state.open && merged.query === state.query) return;
  state = merged;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
// Servern renderar alltid stängt läge; dialogen är klient-only.
const SERVER_STATE: State = { open: false, query: "" };
const getServerSnapshot = () => SERVER_STATE;

/** Kan anropas var som helst, även utanför React. */
export function openSearchPalette() {
  setState({ open: true });
}

export function useCommandPalette() {
  const { open, query } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setOpen = useCallback((v: boolean) => setState({ open: v }), []);
  const toggle = useCallback(() => setState({ open: !state.open }), []);
  const close = useCallback(() => setState({ open: false }), []);
  const openPalette = useCallback(() => setState({ open: true }), []);
  const setQuery = useCallback((q: string) => setState({ query: q }), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const hasMod = e.metaKey || e.ctrlKey;
      if (hasMod && isK) {
        e.preventDefault();
        setState({ open: true });
      }
      if (e.key === "Escape") setState({ open: false });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Bakåtkompatibelt: eventet finns kvar som ingång för kod som inte kan
  // importera hooken, men är inte längre den enda vägen in.
  useEffect(() => {
    const onOpenEvent = () => setState({ open: true });
    window.addEventListener("athopia:open-search", onOpenEvent);
    return () => window.removeEventListener("athopia:open-search", onOpenEvent);
  }, []);

  return { open, setOpen, toggle, close, openPalette, query, setQuery };
}
