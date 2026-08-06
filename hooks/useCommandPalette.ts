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
 * Öppet-läget speglas i URL:en (`?sok=1`) av två skäl: knappen kan vara en
 * riktig länk och fungerar därför även före hydrering, och back-knappen stänger
 * dialogen i stället för att lämna sidan.
 *
 * Stängning använder `replaceState`, inte `history.back()`. Att gå bakåt vore
 * renare i historiken men `close()` anropas också när man klickar ett sökträff-
 * resultat, och då skulle bakåtnavigeringen tävla med Next-routerns framåt-
 * navigering. Priset är en dubblett i historiken när man stänger med X/Escape.
 */
type State = { open: boolean; query: string };

const PARAM = "sok";

const urlIsOpen = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has(PARAM);

function writeUrl(open: boolean) {
  if (typeof window === "undefined" || urlIsOpen() === open) return;
  const url = new URL(window.location.href);
  if (open) url.searchParams.set(PARAM, "1");
  else url.searchParams.delete(PARAM);
  // pushState när vi öppnar → back stänger. replaceState när vi stänger, se ovan.
  if (open) window.history.pushState(window.history.state, "", url);
  else window.history.replaceState(window.history.state, "", url);
}

// Alltid stängt vid modulladdning — annars skiljer sig klientens första
// snapshot från serverns. Direktlänkar öppnas i stället av effekten nedan.
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

/** URL:en ändras med — därför går allt öppna/stänga genom den här. */
function setOpenState(open: boolean) {
  writeUrl(open);
  setState({ open });
}

/** Kan anropas var som helst, även utanför React. */
export function openSearchPalette() {
  setOpenState(true);
}

/** Länkmål som fungerar innan sidan hydrerats. */
export const SEARCH_HREF = `?${PARAM}=1`;

export function useCommandPalette() {
  const { open, query } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setOpen = useCallback((v: boolean) => setOpenState(v), []);
  const toggle = useCallback(() => setOpenState(!state.open), []);
  const close = useCallback(() => setOpenState(false), []);
  const openPalette = useCallback(() => setOpenState(true), []);
  const setQuery = useCallback((q: string) => setState({ query: q }), []);

  // Back/forward: URL:en är sanningen. Stänger dialogen när man backar ur den.
  useEffect(() => {
    const onPopState = () => setState({ open: urlIsOpen() });
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Direktlänk till ?sok=1 (och klicket som skedde före hydrering): synka
  // storen från URL:en en gång efter hydrering.
  useEffect(() => {
    if (urlIsOpen()) setState({ open: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const hasMod = e.metaKey || e.ctrlKey;
      if (hasMod && isK) {
        e.preventDefault();
        setOpenState(true);
      }
      if (e.key === "Escape") setOpenState(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Bakåtkompatibelt: eventet finns kvar som ingång för kod som inte kan
  // importera hooken, men är inte längre den enda vägen in.
  useEffect(() => {
    const onOpenEvent = () => setOpenState(true);
    window.addEventListener("athopia:open-search", onOpenEvent);
    return () => window.removeEventListener("athopia:open-search", onOpenEvent);
  }, []);

  return { open, setOpen, toggle, close, openPalette, query, setQuery };
}
