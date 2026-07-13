import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireColumnist } from "@/lib/columnist";

// POST /api/columns — skapa ett nytt utkast (invite-only, kräver profiles.role='columnist')
export async function POST(req: NextRequest) {
  const columnist = await requireColumnist();
  if (!columnist) {
    return NextResponse.json({ message: "Kräver krönikörsbehörighet" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };

  const db = createServerClient();
  const { data, error } = await db
    .from("columns")
    .insert({
      author_clerk_user_id: columnist.userId,
      title: body.title?.trim() || "Ny krönika",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[columns] insert error:", error);
    return NextResponse.json({ message: "Databasfel" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
