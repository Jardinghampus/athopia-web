"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { TabBar } from "@/components/ui/TabBar";

/**
 * Mobil bottennav — 4 flikar med etiketter (TabBar).
 * Döljs på forum-tråd där compose-baren äger bottenytan.
 */
export function GlassNav({ clerkEnabled: _clerkEnabled }: { clerkEnabled?: boolean }) {
  const pathname = usePathname();
  const hideOnThread = /^\/forum\/.+\/.+/.test(pathname);
  const hideOnAi = pathname === "/ai" || pathname.startsWith("/elite/chat");

  if (hideOnThread || hideOnAi) return null;

  return (
    <div className="md:hidden">
      <TabBar
        items={NAV_ITEMS.map(({ href, label, icon: Icon }) => ({
          href,
          label,
          icon: <Icon strokeWidth={2} />,
        }))}
      />
    </div>
  );
}
