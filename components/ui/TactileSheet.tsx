"use client";

import { Drawer } from "vaul";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Native-feel bottom sheet byggd på vaul.
 * Filen heter TactileSheet.tsx eftersom shadcn:s sheet.tsx redan finns
 * (Windows är case-okänsligt) — men exporten heter Sheet.
 */
export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;
export const SheetPortal = Drawer.Portal;

interface SheetContentProps extends ComponentProps<typeof Drawer.Content> {
  children: ReactNode;
  /** Visa drag-handtaget högst upp (default true) */
  showHandle?: boolean;
  /**
   * Visa `X` i övre högra hörnet (default true).
   *
   * Mobil UX-regel 11: ett ark måste gå att stänga med en synlig kontroll och
   * inte bara med en gest. Handtaget visar att man *kan* svepa, men en
   * förstagångsanvändare — och alla som styr med tangentbord — behöver ikonen.
   */
  showClose?: boolean;
  /** Overlay ovanför docken/andra z-50-lager när arket är ett blockerande val. */
  overlayClassName?: string;
}

export function SheetContent({
  children,
  className,
  showHandle = true,
  showClose = true,
  overlayClassName,
  ...props
}: SheetContentProps) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay
        className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]", overlayClassName)}
      />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-3xl border-t border-border bg-popover text-popover-foreground outline-none",
          "pb-[max(env(safe-area-inset-bottom),1rem)]",
          className
        )}
        {...props}
      >
        {showHandle && (
          <div
            aria-hidden
            className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
          />
        )}
        {showClose && (
          <Drawer.Close
            aria-label="Stäng"
            className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden />
          </Drawer.Close>
        )}
        <div className="overflow-y-auto overscroll-contain px-4 pt-2">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
