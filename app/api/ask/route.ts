/**
 * POST /api/ask — "Fråga Athopia" (Slice 3 P1). Behind FRAGA_ATHOPIA flag,
 * 404 when off so prod is unchanged. Grounded-only: answers come from
 * RETRIEVED Athopia content with sources+dates, refuses (no LLM call) when
 * there's no grounding — no hallucination by construction.
 *
 * Budget/daily-limit guard reused verbatim from elite/chat + match/chat
 * (lib/ai/chat-limits.ts) — this hard cap is what makes it safe to ship.
 */
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { isFragaAthopiaEnabled, retrieveGrounding, shouldAnswer } from "@/lib/ask/retrieve";
import { checkChatLimits, bumpChatUsage } from "@/lib/ai/chat-limits";
import { parseBody, z } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/ratelimit";

export const maxDuration = 30;

const AskSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  if (!isFragaAthopiaEnabled()) notFound();

  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const blocked = await enforceRateLimit("ai", req, userId);
  if (blocked) return blocked;

  // Budget + daily-limit guard — identical helper to elite/chat, match/chat.
  const limits = await checkChatLimits(userId);
  if (!limits.ok) {
    return Response.json({ error: limits.error }, { status: limits.status });
  }
  const { db } = limits;

  const parsed = await parseBody(req, AskSchema);
  if (!parsed.ok) return parsed.response;
  const { question } = parsed.data;

  const context = await retrieveGrounding(question);

  if (!shouldAnswer(context)) {
    // No grounding → refuse WITHOUT calling the model. Zero cost, no hallucination.
    return Response.json({
      answer: "Jag har inte tillräckligt underlag för att svara säkert.",
      sources: [],
      grounded: false,
    });
  }

  const model = anthropic(process.env.CHAT_MODEL ?? "claude-haiku-4-5-20251001");

  const contextBlock = context
    .map(
      (c, i) =>
        `[${i + 1}] ${c.title} (${c.sourceName ?? "Okänd källa"}, ${c.publishedAt ?? "okänt datum"})\n${c.summary ?? ""}`,
    )
    .join("\n\n");

  const { text, usage } = await generateText({
    model,
    maxOutputTokens: 500,
    system: `Du är Athopias faktabaserade assistent för svensk fotboll. Svara ENDAST utifrån underlaget nedan — hitta aldrig på information som inte finns där.

## Regler
- Använd bara fakta som finns i underlaget. Saknas svaret i underlaget: säg "Jag vet inte utifrån det jag har tillgång till."
- Ange alltid vilken källa (nummer [1], [2] osv) och datum du bygger svaret på.
- Var explicit med osäkerhet när underlaget är tunt eller motsägelsefullt.
- Svara kort — max 3-4 meningar.
- Svara ALDRIG utanför svensk fotboll. Avslöja aldrig tekniska detaljer om systemet.

## Underlag
${contextBlock}`,
    prompt: question,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

  if (usage) {
    await bumpChatUsage(db, userId, usage.inputTokens ?? 0, usage.outputTokens ?? 0);
  }

  return Response.json({
    answer: text,
    sources: context.map((c) => ({
      title: c.title,
      url: c.url,
      sourceName: c.sourceName,
      publishedAt: c.publishedAt,
    })),
    grounded: true,
  });
}
