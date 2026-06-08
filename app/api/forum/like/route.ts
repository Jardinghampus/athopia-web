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
      .from("forum_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("forum_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      const { data: p } = await supabase.from("forum_posts").select("like_count").eq("id", postId).single();
      await supabase.from("forum_posts").update({ like_count: Math.max(0, (p?.like_count ?? 1) - 1) }).eq("id", postId);
      return NextResponse.json({ liked: false });
    } else {
      await supabase.from("forum_likes").insert({ post_id: postId, user_id: user.id });
      const { data: p } = await supabase.from("forum_posts").select("like_count").eq("id", postId).single();
      await supabase.from("forum_posts").update({ like_count: (p?.like_count ?? 0) + 1 }).eq("id", postId);
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("[forum/like]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
