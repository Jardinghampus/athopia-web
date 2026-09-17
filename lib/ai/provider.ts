import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * LLM-provider för webens chattar — anropen går genom athopia-os, inte direkt
 * till Anthropic.
 *
 * Founderregel 2026-09-17: nycklarna ligger i os. Web har ingen
 * ANTHROPIC_API_KEY (den är tom i alla Vercel-miljöer med flit), så
 * `POST {OS_LLM_BASE_URL}/messages` är enda vägen. os håller nyckeln, kör
 * checkBudget() mot samma cap som agenterna och loggar spend till agent_logs.
 *
 * Verktygen och system-prompterna stannar här: de läser Supabase från web och
 * har inget att göra i fabriken. Det är bara nyckeln och kostnadsgrinden som
 * flyttat.
 */

export class MissingOsLlmConfig extends Error {
  constructor() {
    super("OS_LLM_BASE_URL eller ATHOPIA_OS_HTTP_SECRET saknas");
  }
}

export function osChatModel(model?: string) {
  const baseURL = process.env.OS_LLM_BASE_URL?.trim();
  const secret = process.env.ATHOPIA_OS_HTTP_SECRET?.trim();
  if (!baseURL || !secret) throw new MissingOsLlmConfig();

  const anthropic = createAnthropic({
    baseURL,
    // Nyckeln sitter i os. AI-SDK:n kräver ändå ett värde i x-api-key —
    // proxyn ignorerar det och sätter den riktiga nyckeln själv.
    apiKey: "proxied-by-athopia-os",
    headers: { "x-athopia-os-secret": secret },
  });

  return anthropic(model ?? process.env.CHAT_MODEL ?? "claude-haiku-4-5-20251001");
}

/** Felsvar när proxyn inte är konfigurerad — samma text i alla chattar. */
export function osLlmUnavailable(): Response {
  return Response.json(
    { error: "AI-tjänsten är inte tillgänglig just nu. Försök igen om en stund." },
    { status: 503 },
  );
}
