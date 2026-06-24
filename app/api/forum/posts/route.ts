import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody, z } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";

const ForumPostSchema = z.object({
  content: z.string().trim().min(1, "content krävs").max(500, "Max 500 tecken"),
  parent_id: z.string().uuid().optional(),
  root_id: z.string().uuid().optional(),
  quoted_post_id: z.string().uuid().optional(),
  team_slug: z.string().max(100).optional(),
  sport: z.enum(["football", "golf"]).default("football"),
  label: z.enum(["transfer", "taktik", "match", "rykte", "diskussion"]).nullable().optional(),
});

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ posts: [] });
  }
  try {
    const { searchParams } = new URL(req.url);
    const teamSlug = searchParams.get("teamSlug");
    const sport = searchParams.get("sport") ?? "football";
    const sort = searchParams.get("sort") ?? "hot";
    const rootId = searchParams.get("rootId");

    const supabase = createServerClient();
    let q = supabase
      .from("forum_posts")
      .select("*")
      .eq("sport", sport)
      .eq("status", "published");

    if (rootId) {
      q = q.eq("root_id", rootId);
    } else {
      q = q.is("parent_id", null);
      if (teamSlug) q = q.eq("team_slug", teamSlug);
    }

    if (sort === "hot") {
      q = q.order("hot_score", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data, error } = await q.limit(50);
    if (error) throw error;
    return NextResponse.json({ posts: data ?? [] });
  } catch (err) {
    console.error("[forum/posts GET]", err);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "Ej inloggad" }, { status: 401 });

    if (!isSupabaseConfigured()) return NextResponse.json({ message: "DB ej konfigurerad" }, { status: 503 });

    // Rate limit per inloggad användare (skydd mot spam/missbruk vid skala)
    const blocked = await enforceRateLimit("write", req, user.id);
    if (blocked) return blocked;

    const parsed = await parseBody(req, ForumPostSchema);
    if (!parsed.ok) return parsed.response;
    const { parent_id, root_id, quoted_post_id, team_slug, sport, label } = parsed.data;
    const content = sanitizeText(parsed.data.content);
    if (!content) {
      return NextResponse.json({ message: "content krävs" }, { status: 400 });
    }

    const supabase = createServerClient();

    let depth = 0;
    if (parent_id) {
      const { data: parentPost } = await supabase
        .from("forum_posts")
        .select("depth")
        .eq("id", parent_id)
        .single();
      depth = (parentPost?.depth ?? 0) + 1;
    }

    const { data: post, error } = await supabase
      .from("forum_posts")
      .insert({
        content: content.trim(),
        parent_id: parent_id ?? null,
        root_id: root_id ?? null,
        quoted_post_id: quoted_post_id ?? null,
        team_slug: team_slug ?? null,
        sport,
        depth,
        label: label ?? null,
        author_id: user.id,
        author_name: user.fullName ?? user.username ?? "Anonym",
        author_avatar: user.imageUrl ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    if (parent_id) {
      await supabase.rpc("increment_reply_count", { row_id: parent_id });

      // Notify parent post author (skip if replying to own post)
      const { data: parentPost } = await supabase
        .from("forum_posts")
        .select("author_id")
        .eq("id", parent_id)
        .maybeSingle();
      const parentAuthorId = (parentPost as any)?.author_id;
      if (parentAuthorId && parentAuthorId !== user.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: parentAuthorId,
            type: "reply",
            actor_id: user.id,
            actor_name: user.fullName ?? user.username ?? "Anonym",
            post_id: (post as any).id,
          });
        } catch {}
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("[forum/posts POST]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
