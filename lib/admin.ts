/**
 * lib/admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-behörighet via allowlist (Clerk user-ID i ADMIN_USER_IDS).
 *
 * Projektet har ingen roll-modell i Clerk, så en env-baserad allowlist är den
 * enklaste robusta lösningen. Sätt ADMIN_USER_IDS i Vercel + .env.local som en
 * komma-separerad lista av Clerk user-ID:n (t.ex. "user_2ab...,user_3cd...").
 *
 * Säker default: om ADMIN_USER_IDS saknas är INGEN admin (admin-ytor låsta).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { auth } from "@clerk/nextjs/server";

function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ren kontroll — säker att använda i proxy.ts (middleware) där userId redan är känt. */
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return adminUserIds().includes(userId);
}

/** Server-side: är den inloggade användaren admin? För Server Components + route handlers. */
export async function currentUserIsAdmin(): Promise<boolean> {
  const { userId } = await auth();
  return isAdminUser(userId);
}
