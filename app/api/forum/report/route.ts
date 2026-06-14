import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerClient();
  await supabase.from("forum_reports").insert({
    post_id: postId,
    reporter_id: userId,
    status: "pending",
  });

  return NextResponse.json({ ok: true });
}
