"use client";

import { useEffect, useRef } from "react";

/**
 * Fokushantering för handrullade modaler och lådor.
 *
 * De overlays som byggts på en primitiv (`components/ui/sheet.tsx` → Base UI,
 * `ComposeDrawer` → vaul) får det här gratis. De handrullade gjorde det inte:
 * fokus låg kvar i bakgrunden när de öppnades, Tab vandrade ut i sidan bakom,
 * och när de stängdes hamnade fokus på `<body>` i stället för på knappen man
 * kom ifrån. För tangentbord och skärmläsare betyder det att en "modal" inte
 * är modal alls.
 *
 * Hooken ger ARIA APG:s dialogbeteende:
 *  - flyttar fokus in i dialogen när den öppnas
 *  - håller kvar Tab/Shift+Tab innanför den
 *  - Escape stänger
 *  - lämnar tillbaka fokus till elementet som öppnade den
 *  - låser bakgrundsscroll
 *
 * Sätt `role="dialog"`, `aria-modal="true"`, ett tillgängligt namn och
 * `tabIndex={-1}` på noden du fäster ref:en på.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useModalA11y<T extends HTMLElement>(
  open: boolean,
  onClose?: () => void,
) {
  const ref = useRef<T>(null);
  // Hålls i en ref så att en ny onClose-identitet per render inte river och
  // sätter upp effekten igen — det skulle stjäla tillbaka fokus vid varje
  // knapptryck i dialogen. Skrivningen sker i en effekt, inte under render:
  // React kan slänga eller spela om en render, och en muterad ref kan då läcka
  // från UI som aldrig committades.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const node = ref.current;
    if (!open || !node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      });

    // Respektera en explicit autoFocus i innehållet innan vi tar över.
    const preferred = node.querySelector<HTMLElement>("[data-autofocus]");
    (preferred ?? focusables()[0] ?? node).focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        // Inget fokuserbart innehåll — håll ändå kvar fokus i dialogen.
        e.preventDefault();
        node.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = node.contains(active);

      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture-fasen: fångar Tab även när fokus råkat hamna utanför noden.
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Bara om elementet fortfarande finns kvar i DOM:en.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  return ref;
}
