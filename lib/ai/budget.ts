/**
 * Global AI budget SSOT for athopia-web (LAUNCH-04).
 * Workspace hard cap $20/mån wins until founder changes policy.
 * Prefer MONTHLY_BUDGET_USD env when set lower; never default above HARD_CAP.
 */

export const AI_MONTHLY_HARD_CAP_USD = 20;

/** Effective monthly USD cap — env can tighten, never raise above hard cap. */
export function monthlyBudgetUsd(): number {
  const fromEnv = Number(process.env.MONTHLY_BUDGET_USD);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.min(fromEnv, AI_MONTHLY_HARD_CAP_USD);
  }
  return AI_MONTHLY_HARD_CAP_USD;
}

export const CHAT_DAILY_LIMIT = Number(process.env.DAILY_LIMIT ?? "30");
