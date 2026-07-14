# Feature: AI-chat

## Användarvärde
Fråga om Allsvenskan — tabell, nyheter, matcher. PRO+ (Elite för full chat).

## Dataflöde
```
User → athopia-web POST /api/elite/chat | /api/match/chat
  → Claude Haiku + lib/ai/tools.ts → Supabase
  → bump_chat_usage RPC
```

## Byggt i

| Lager | Filer |
|-------|-------|
| web | `app/api/elite/chat/route.ts` — PRO+ (globalAiChat, founderbeslut D2 2026-07-14) |
| web | `app/api/match/chat/route.ts` — PRO+, match context |
| web | `lib/ai/tools.ts`, `lib/ai/chat-limits.ts` |
| web | `app/(app)/elite/chat/page.tsx`, `CompactChatPanel.tsx` |

## Tabeller
- `chat_usage` — daglig gräns + tokens

## AI fix
1. **Tools** — `lib/ai/tools.ts` (data hämtas här)
2. **System prompt** — i respektive route.ts
3. **Limits** — `chat-limits.ts`, `DAILY_LIMIT`, `MONTHLY_BUDGET_USD`
4. **403** — Clerk `publicMetadata.plan`

## Arkitektur-varning
User-chat körs på **Vercel**, inte os `withBudget`. Framtida: central LLM-gateway i os.

## PRO-gate
PRO: `/ai` (global) och `/api/match/chat` (matchkontext). Free: UpgradePrompt.
Gaten kommer alltid från `lib/access-rules.ts` — hårdkoda aldrig plannamn i copy.
