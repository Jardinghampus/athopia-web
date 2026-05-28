/**
 * app/api/related/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hämtar relaterade artiklar via pgvector cosine-similarity.
 *
 * Endpoint: GET /api/related?id=<article-id>
 *
 * Beslut:
 * - Supabase RPC `match_articles` anropas med artikel-embeddingen.
 * - Returnerar max 3 relaterade artiklar (exkluderar källartikeln).
 * - Cache-header: 1 timme.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Article } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Saknar id-parameter" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Hämta källartikelns embedding
    const { data: source, error: sourceError } = await supabase
      .from("articles")
      .select("embedding")
      .eq("id", id)
      .single();

    if (sourceError || !source?.embedding) {
      return NextResponse.json([]);
    }

    // pgvector RPC: match_articles(query_embedding, match_threshold, match_count, exclude_id)
    const { data: related, error: rpcError } = await supabase.rpc(
      "match_articles",
      {
        query_embedding: source.embedding,
        match_threshold: 0.75,
        match_count: 3,
        exclude_id: id,
      }
    );

    if (rpcError) {
      console.error("[/api/related] pgvector RPC fel:", rpcError);
      return NextResponse.json([]);
    }

    return NextResponse.json(related as Article[], {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[/api/related]", err);
    return NextResponse.json([]);
  }
}
