import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ notifications: [] }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ notifications: [] });

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, actor_name, post_id, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    return NextResponse.json({ notifications: data ?? [] });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  try {
    const body = await req.json() as { id?: string; markAll?: boolean };
    const supabase = createServiceClient();

    if (body.markAll) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    } else if (body.id) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", body.id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
