import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

// Called by n8n cron every hour: POST /api/forum/summarize?teamSlug=djurgardens-if&secret=X
// Reads last 4 hours of posts → Claude Haiku → stores in agent_memory

const PROMPT_TEMPLATE = (teamName: string, posts: string) => `Du är en AI-assistent för Athopia, en svensk fotbollscommunity. Du ska sammanfatta vad supportrar för ${teamName} diskuterar just nu.

Här är inläggen från de senaste 4 timmarna (sorterade efter engagement):
---
${posts}
---

Skriv EN kort sammanfattning på svenska (max 3 meningar, max 200 ord). Fokusera på:
- Vad är det hetaste ämnet just nu?
- Finns det rykten eller transfernyheter? Nämn dem konkret.
- Vad reagerar folk på från senaste matchen, om relevant?

Skriv direkt, ingen inledning. Var konkret och engagerande. Inga emojis. Avsluta inte med "Sammantaget" eller liknande.`;

export async function POST(req: NextRequest) {
  // Simple secret check — set FORUM_SUMMARIZE_SECRET in Vercel env
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.FORUM_SUMMARIZE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamSlug = req.nextUrl.searchParams.get("teamSlug");
  if (!teamSlug) return NextResponse.json({ error: "teamSlug required" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 503 });

  try {
    const supabase = createServiceClient();

    // Get team name
    const { data: entity } = await supabase
      .from("entities")
      .select("name")
      .eq("slug", teamSlug)
      .eq("type", "team")
      .maybeSingle();
    const teamName = (entity as any)?.name ?? teamSlug;

    // Fetch posts from last 4 hours
    const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("content, author_name, like_count, reply_count, label, created_at")
      .eq("team_slug", teamSlug)
      .eq("sport", "football")
      .eq("status", "published")
      .is("parent_id", null)
      .gte("created_at", since)
      .order("hot_score", { ascending: false })
      .limit(30);

    if (!posts || posts.length < 2) {
      return NextResponse.json({ skipped: true, reason: "Fewer than 2 posts in last 4h" });
    }

    const postsText = (posts as any[])
      .map((p, i) => {
        const label = p.label ? `[${p.label}] ` : "";
        return `${i + 1}. ${label}${p.content} (👍${p.like_count} 💬${p.reply_count})`;
      })
      .join("\n");

    // Call Claude Haiku directly via fetch
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: PROMPT_TEMPLATE(teamName, postsText),
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[forum/summarize] Anthropic error:", err);
      return NextResponse.json({ error: "Anthropic call failed" }, { status: 502 });
    }

    const result = await response.json() as any;
    const summary: string = result.content?.[0]?.text?.trim() ?? "";

    if (!summary) return NextResponse.json({ error: "Empty summary" }, { status: 500 });

    // Upsert into agent_memory (keyed by teamSlug)
    await supabase.from("agent_memory").upsert(
      {
        agent_id: "forum-summarizer",
        category: `forum_summary_${teamSlug}`,
        content: summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,category" }
    );

    // Log cost to agent_logs
    const inputTokens: number = result.usage?.input_tokens ?? 0;
    const outputTokens: number = result.usage?.output_tokens ?? 0;
    const costUsd = inputTokens * 0.00000025 + outputTokens * 0.00000125;
    await supabase.from("agent_logs").insert({
      agent_id: "forum-summarizer",
      action: `summarize_forum_${teamSlug}`,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      cost_usd: costUsd,
      metadata: { teamSlug, postCount: posts.length },
    }).throwOnError().then(() => {}).catch(() => {});

    return NextResponse.json({ ok: true, teamSlug, summary, postCount: posts.length });
  } catch (err) {
    console.error("[forum/summarize]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
