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
 * Enda källan för top-level-navigering.
 *
 * Botten = dagliga vanor (5 flikar).
 * Sidobar = samma + vanliga genvägar (öppet utan Mer).
 * Mer/hamburger = overflow (konto, poddar, analys …).
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matcha bara exakt path, inte startsWith — annars matchar "/" allt. */
  exact?: boolean;
}

/** Mobil (+ alltid synlig) bottenrad. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Shield },
  { href: "/nyheter", label: "Flöde", icon: Newspaper },
  { href: "/allsvenskan", label: "Allsvenskan", icon: Trophy },
  { href: "/match", label: "Matcher", icon: CalendarDays },
  { href: "/ai", label: "AI", icon: Sparkles },
];

/**
 * Desktop-sidobar — bottenflikar + genvägar som tidigare låg bakom Mer.
 * Håll den kort; konto/prenumeration ligger kvar under Mer.
 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  ...BOTTOM_NAV_ITEMS,
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/daily", label: "Daily", icon: Headphones },
  { href: "/analys", label: "Analys", icon: FileSearch },
];

/** Overflow: Mer-sida + hamburger. Inga dubbletter mot bottenraden. */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/analys", label: "Matchanalyser", icon: FileSearch },
  { href: "/daily", label: "Athopia Daily", icon: Headphones },
  { href: "/podcast", label: "Poddar", icon: Headphones },
  { href: "/konto", label: "Konto", icon: User },
  { href: "/prenumerera", label: "Prenumeration", icon: CreditCard },
  { href: "/om-oss", label: "Om Athopia", icon: Info },
  { href: "/mer", label: "Mer", icon: MoreHorizontal },
];

/** @deprecated Använd BOTTOM_NAV_ITEMS — behålls för tillfälliga imports. */
export const NAV_ITEMS = BOTTOM_NAV_ITEMS;
