"use client";

import { Drawer } from "vaul";
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
}

export function SheetContent({
  children,
  className,
  showHandle = true,
  ...props
}: SheetContentProps) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
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
