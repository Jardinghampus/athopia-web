import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody, z } from "@/lib/validation";

const ReportSchema = z.object({ postId: z.string().uuid("Ogiltigt postId") });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  const parsed = await parseBody(req, ReportSchema);
  if (!parsed.ok) return parsed.response;
  const { postId } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerClient();
  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .select("id, author_id, status")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    console.error("[forum/report]", postError);
    return NextResponse.json({ error: "Serverfel" }, { status: 500 });
  }
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Inlägget hittades inte" }, { status: 404 });
  }
  if (post.author_id === userId) {
    return NextResponse.json(
      { error: "Du kan inte rapportera ditt eget inlägg" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("forum_reports")
    .select("id")
    .eq("post_id", postId)
    .eq("reporter_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error: insertError } = await supabase.from("forum_reports").insert({
    post_id: postId,
    reporter_id: userId,
    status: "pending",
  });

  if (insertError) {
    console.error("[forum/report] insert:", insertError);
    return NextResponse.json({ error: "Kunde inte skicka rapport" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
