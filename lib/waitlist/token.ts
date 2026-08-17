/**
 * lib/waitlist/token.ts — dubbel opt-in-token.
 *
 * Rå token går bara till mejlet. Databasen lagrar sha256-hashen, så en läckt
 * DB-dump inte innehåller giltiga bekräftelselänkar.
 */

import { createHash, randomBytes } from "crypto";

/** 48 timmar, enligt produktkontraktet. */
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

export function createConfirmToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashConfirmToken(token) };
}

export function hashConfirmToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function confirmExpiryFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + CONFIRM_TTL_MS);
}

export function isExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  const ts = Date.parse(expiresAt);
  return Number.isNaN(ts) || ts < now.getTime();
}
