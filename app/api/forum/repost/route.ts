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

    const { data: reposted, error } = await supabase.rpc("toggle_repost", {
      p_post_id: postId,
      p_user_id: user.id,
    });

    if (error) throw error;
    return NextResponse.json({ reposted });
  } catch (err) {
    console.error("[forum/repost]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
