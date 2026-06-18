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
  await supabase.from("forum_reports").insert({
    post_id: postId,
    reporter_id: userId,
    status: "pending",
  });

  return NextResponse.json({ ok: true });
}
