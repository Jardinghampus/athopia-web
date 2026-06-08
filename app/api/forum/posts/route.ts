import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

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

    const body = await req.json() as {
      content?: string;
      parent_id?: string;
      root_id?: string;
      quoted_post_id?: string;
      team_slug?: string;
      sport?: string;
      depth?: number;
    };

    const { content, parent_id, root_id, quoted_post_id, team_slug, sport = "football" } = body;

    if (!content?.trim()) {
      return NextResponse.json({ message: "content krävs" }, { status: 400 });
    }
    if (content.trim().length > 500) {
      return NextResponse.json({ message: "Max 500 tecken" }, { status: 400 });
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
        author_id: user.id,
        author_name: user.fullName ?? user.username ?? "Anonym",
        author_avatar: user.imageUrl ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    if (parent_id) {
      await supabase.rpc("increment_reply_count", { row_id: parent_id });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("[forum/posts POST]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
