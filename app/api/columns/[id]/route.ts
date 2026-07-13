import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireColumnist } from "@/lib/columnist";

interface ColumnUpdate {
  title?: string;
  content?: unknown;
  content_html?: string;
  excerpt?: string | null;
  team_entity_id?: string | null;
  status?: "draft" | "published";
}

async function assertOwnership(id: string, userId: string) {
  const db = createServerClient();
  const { data } = await db.from("columns").select("author_clerk_user_id").eq("id", id).maybeSingle();
  return data?.author_clerk_user_id === userId;
}

// PATCH /api/columns/[id] — spara utkast eller publicera. Ägarskap kontrolleras
// mot inloggad krönikör; ingen kan redigera någon annans text.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const columnist = await requireColumnist();
  if (!columnist) {
    return NextResponse.json({ message: "Kräver krönikörsbehörighet" }, { status: 403 });
  }

  const { id } = await params;
  if (!(await assertOwnership(id, columnist.userId))) {
    return NextResponse.json({ message: "Ej din krönika" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as ColumnUpdate;
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title.trim().slice(0, 200);
  if (body.content !== undefined) patch.content = body.content;
  if (body.content_html !== undefined) patch.content_html = body.content_html;
  if (body.excerpt !== undefined) patch.excerpt = body.excerpt?.trim().slice(0, 300) || null;
  if (body.team_entity_id !== undefined) patch.team_entity_id = body.team_entity_id || null;
  if (body.status !== undefined) patch.status = body.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "Inget att uppdatera" }, { status: 400 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("columns")
    .update(patch)
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) {
    console.error("[columns] update error:", error);
    return NextResponse.json({ message: "Databasfel" }, { status: 500 });
  }

  return NextResponse.json(data);
}
