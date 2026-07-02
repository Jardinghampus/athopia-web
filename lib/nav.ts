import { Shield, Trophy, CalendarDays, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Enda källan för top-level-navigering. AppSidebar (desktop) och GlassNav
 * (mobil bottenrad) läser båda denna array — ingen egen NAV_ITEMS-lista.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matcha bara exakt path, inte startsWith — annars matchar "/" allt. */
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Shield },
  { href: "/allsvenskan", label: "Allsvenskan", icon: Trophy },
  { href: "/match", label: "Matcher", icon: CalendarDays },
  { href: "/mer", label: "Mer", icon: MoreHorizontal },
];
