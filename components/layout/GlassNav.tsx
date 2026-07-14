"use client";

import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav";
import { TabBar } from "@/components/ui/TabBar";

/**
 * Bottennav — 5 flikar (Mitt lag · Flöde · Allsvenskan · Matcher · AI).
 * Synlig på alla bredder. Döljs bara på forum-tråd där compose äger bottenytan.
 */
export function GlassNav({ clerkEnabled: _clerkEnabled }: { clerkEnabled?: boolean }) {
  const pathname = usePathname();
  const hideOnThread = /^\/forum\/.+\/.+/.test(pathname);

  if (hideOnThread) return null;

  return (
    <TabBar
      items={BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => ({
        href,
        label,
        icon: <Icon strokeWidth={2} />,
      }))}
    />
  );
}
