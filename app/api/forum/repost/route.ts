import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "Ej inloggad" }, { status: 401 });
    if (!isSupabaseConfigured()) return NextResponse.json({ message: "DB ej konfigurerad" }, { status: 503 });

    const { postId } = await req.json() as { postId?: string };
    if (!postId) return NextResponse.json({ message: "postId krävs" }, { status: 400 });

    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("forum_reposts")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("forum_reposts").delete().eq("post_id", postId).eq("user_id", user.id);
      const { data: p } = await supabase.from("forum_posts").select("repost_count").eq("id", postId).single();
      await supabase.from("forum_posts").update({ repost_count: Math.max(0, (p?.repost_count ?? 1) - 1) }).eq("id", postId);
      return NextResponse.json({ reposted: false });
    } else {
      await supabase.from("forum_reposts").insert({ post_id: postId, user_id: user.id });
      const { data: p } = await supabase.from("forum_posts").select("repost_count").eq("id", postId).single();
      await supabase.from("forum_posts").update({ repost_count: (p?.repost_count ?? 0) + 1 }).eq("id", postId);
      return NextResponse.json({ reposted: true });
    }
  } catch (err) {
    console.error("[forum/repost]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
