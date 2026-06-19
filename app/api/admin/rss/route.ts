/**
 * app/api/admin/rss/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-hantering av rss_sources (lägg till / pausa / aktivera).
 *
 * Skyddat dubbelt: proxy.ts blockerar /api/admin/* till allowlist, och denna
 * route kör med service-role (kringgår RLS) → verifiera currentUserIsAdmin här.
 *
 * - GET   : lista alla källor (grupperas i UI)
 * - POST  : lägg till en källa
 * - PATCH : uppdatera active (pausa/aktivera) på en källa via id
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { currentUserIsAdmin } from "@/lib/admin";
import { parseBody, z } from "@/lib/validation";

const AddSchema = z.object({
  name: z.string().trim().min(1, "name krävs").max(120),
  url: z.string().trim().url("Ogiltig URL").max(500),
  category: z.enum(["news", "club", "league", "podcast"]),
  sport: z.enum(["football", "golf"]).default("football"),
  purpose: z.enum(["signal", "inspiration"]).default("signal"),
  active: z.boolean().default(true),
  language: z.string().max(8).default("sv"),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

/** Slugify till ett stabilt external_id (dedup-nyckel). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function GET() {
  if (!(await currentUserIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ sources: [] });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .select("id, name, url, category, sport, purpose, active, error_count, last_fetched_at")
    .order("purpose", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await currentUserIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const parsed = await parseBody(req, AddSchema);
  if (!parsed.ok) return parsed.response;
  const { name, url, category, sport, purpose, active, language } = parsed.data;

  const supabase = createServerClient();
  const external_id = `${purpose}-${sport}-${slugify(name)}`;

  const { data, error } = await supabase
    .from("rss_sources")
    .upsert(
      { external_id, name, url, category, sport, purpose, active, language },
      { onConflict: "external_id" }
    )
    .select("id, name, url, category, sport, purpose, active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await currentUserIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const parsed = await parseBody(req, PatchSchema);
  if (!parsed.ok) return parsed.response;
  const { id, active } = parsed.data;

  const supabase = createServerClient();
  const { error } = await supabase
    .from("rss_sources")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
