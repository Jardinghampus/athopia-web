import {
  Shield,
  Newspaper,
  MessageSquare,
  MoreHorizontal,
  Trophy,
  CalendarDays,
  BarChart3,
  Sparkles,
  Headphones,
  User,
  CreditCard,
  Info,
  FileSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Enda källan för top-level-navigering. AppSidebar (desktop), TabBar/GlassNav
 * (mobil bottenrad) och MobileNav (hamburger) läser denna — ingen parallell lista.
 *
 * Botten = dagliga vanor (4 flikar).
 * Hamburger = sekundärt (SEO-djup, verktyg, konto).
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matcha bara exakt path, inte startsWith — annars matchar "/" allt. */
  exact?: boolean;
}

/** Primär bottennav / sidebar — max 4. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Shield },
  { href: "/nyheter", label: "Flöde", icon: Newspaper },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/mer", label: "Mer", icon: MoreHorizontal },
];

/** Hamburger / Mer-extra — inte i bottenraden. */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/allsvenskan", label: "Allsvenskan", icon: Trophy },
  { href: "/match", label: "Matcher", icon: CalendarDays },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/analys", label: "Matchanalyser", icon: FileSearch },
  { href: "/ai", label: "AI-chatt", icon: Sparkles },
  { href: "/daily", label: "Athopia Daily", icon: Headphones },
  { href: "/podcast", label: "Poddar", icon: Headphones },
  { href: "/konto", label: "Konto", icon: User },
  { href: "/prenumerera", label: "Prenumeration", icon: CreditCard },
  { href: "/om-oss", label: "Om Athopia", icon: Info },
];
