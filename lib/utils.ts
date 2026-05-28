import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | number | Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRelative(date: string | number | Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const abs = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat("sv", { numeric: "auto" });

  const mins = Math.round(diffSec / 60);
  if (abs < 60) return rtf.format(-diffSec, "second");
  if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");

  const hours = Math.round(diffSec / 3600);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");

  const days = Math.round(diffSec / 86400);
  if (Math.abs(days) < 7) return rtf.format(-days, "day");

  const weeks = Math.round(diffSec / (86400 * 7));
  if (Math.abs(weeks) < 5) return rtf.format(-weeks, "week");

  const months = Math.round(diffSec / (86400 * 30));
  if (Math.abs(months) < 12) return rtf.format(-months, "month");

  const years = Math.round(diffSec / (86400 * 365));
  return rtf.format(-years, "year");
}

export function truncate(text: string, length: number): string {
  const t = text ?? "";
  if (t.length <= length) return t;
  return `${t.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

export function slugify(text: string): string {
  return (text ?? "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatSEK(amount: number): string {
  // Om input är "3900" (öre), anta att vi vill visa 39 kr/mån.
  // Om input redan är "39", blir det 39 kr/mån.
  const value = amount >= 100 ? Math.round(amount / 100) : Math.round(amount);
  return `${value} kr/mån`;
}

export function getSentimentLabel(score: number): "Positiv" | "Neutral" | "Negativ" {
  if (score > 0.15) return "Positiv";
  if (score < -0.15) return "Negativ";
  return "Neutral";
}

export function getSentimentColor(score: number): string {
  if (score > 0.15) return "text-pitch-light";
  if (score < -0.15) return "text-red-400";
  return "text-muted-foreground";
}

export function getTrendIcon(trend: "rising" | "falling" | "stable"): "↑" | "↓" | "→" {
  if (trend === "rising") return "↑";
  if (trend === "falling") return "↓";
  return "→";
}

export function calculateReadTime(content: string | null | undefined): string {
  const text = (content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "1 min läsning";
  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min läsning`;
}
