"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

export interface TabBarItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Ikonvariant när fliken är aktiv (t.ex. filled) */
  activeIcon?: ReactNode;
}

interface TabBarProps {
  items: TabBarItem[];
  className?: string;
}

/**
 * Native-feel bottenmeny med safe-area-padding och spring-animerad
 * aktiv markör. Aktiv flik avgörs av pathname (prefix-match).
 */
export function TabBar({ items, className }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/85 backdrop-blur-xl",
        "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 px-2 pb-1 pt-2 select-none touch-manipulation transition-colors duration-200 active:opacity-70",
                active ? "text-pitch" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="tabbar-indicator"
                  transition={transitions.snappy}
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-pitch"
                />
              )}
              <span className="[&_svg]:size-6" aria-hidden>
                {active && item.activeIcon ? item.activeIcon : item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
