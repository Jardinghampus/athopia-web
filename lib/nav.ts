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
  /** SF Symbol för samma destination i den genererade iOS-navigationen. */
  iosSymbol: string;
  /** Matcha bara exakt path, inte startsWith — annars matchar "/" allt. */
  exact?: boolean;
}

/** Mobil (+ alltid synlig) bottenrad. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Shield, iosSymbol: "shield.fill" },
  { href: "/nyheter", label: "Flöde", icon: Newspaper, iosSymbol: "newspaper.fill" },
  { href: "/allsvenskan", label: "Allsvenskan", icon: Trophy, iosSymbol: "trophy.fill" },
  { href: "/match", label: "Matcher", icon: CalendarDays, iosSymbol: "calendar" },
  { href: "/ai", label: "AI", icon: Sparkles, iosSymbol: "sparkles" },
];

/**
 * Desktop-sidobar — bottenflikar + genvägar som tidigare låg bakom Mer.
 * Håll den kort; konto/prenumeration ligger kvar under Mer.
 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  ...BOTTOM_NAV_ITEMS,
  { href: "/forum", label: "Forum", icon: MessageSquare, iosSymbol: "bubble.left.and.bubble.right.fill" },
  { href: "/statistik", label: "Statistik", icon: BarChart3, iosSymbol: "chart.bar.fill" },
  { href: "/daily", label: "Daily", icon: Headphones, iosSymbol: "headphones" },
  { href: "/analys", label: "Analys", icon: FileSearch, iosSymbol: "doc.text.magnifyingglass" },
];

/** Overflow: Mer-sida + hamburger. Inga dubbletter mot bottenraden. */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/forum", label: "Forum", icon: MessageSquare, iosSymbol: "bubble.left.and.bubble.right.fill" },
  { href: "/statistik", label: "Statistik", icon: BarChart3, iosSymbol: "chart.bar.fill" },
  { href: "/analys", label: "Matchanalyser", icon: FileSearch, iosSymbol: "doc.text.magnifyingglass" },
  { href: "/daily", label: "Athopia Daily", icon: Headphones, iosSymbol: "headphones" },
  { href: "/podcast", label: "Poddar", icon: Headphones, iosSymbol: "waveform" },
  { href: "/konto", label: "Konto", icon: User, iosSymbol: "person.crop.circle" },
  { href: "/prenumerera", label: "Prenumeration", icon: CreditCard, iosSymbol: "creditcard.fill" },
  { href: "/om-oss", label: "Om Athopia", icon: Info, iosSymbol: "info.circle" },
  { href: "/mer", label: "Mer", icon: MoreHorizontal, iosSymbol: "ellipsis" },
];

/** @deprecated Använd BOTTOM_NAV_ITEMS — behålls för tillfälliga imports. */
export const NAV_ITEMS = BOTTOM_NAV_ITEMS;
