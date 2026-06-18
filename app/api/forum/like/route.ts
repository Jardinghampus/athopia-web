import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody, z } from "@/lib/validation";

const LikeSchema = z.object({ postId: z.string().uuid("Ogiltigt postId") });

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "Ej inloggad" }, { status: 401 });
    if (!isSupabaseConfigured()) return NextResponse.json({ message: "DB ej konfigurerad" }, { status: 503 });

    const blocked = await enforceRateLimit("write", req, user.id);
    if (blocked) return blocked;

    const parsed = await parseBody(req, LikeSchema);
    if (!parsed.ok) return parsed.response;
    const { postId } = parsed.data;

    const supabase = createServerClient();

    const { data: liked, error } = await supabase.rpc("toggle_like", {
      p_post_id: postId,
      p_user_id: user.id,
    });

    if (error) throw error;
    return NextResponse.json({ liked });
  } catch (err) {
    console.error("[forum/like]", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
