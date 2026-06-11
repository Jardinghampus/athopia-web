import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUserIsAdmin } from "@/lib/admin";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  // Försvar på djupet — middleware blockerar redan, men denna route kör med
  // service-role-nyckeln (kringgår RLS), så verifiera admin även här.
  if (!(await currentUserIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      articleId?: string;
      isAllsvenskan?: boolean;
      teamSlugs?: string[];
    };

    const { articleId, isAllsvenskan, teamSlugs = [] } = body;
    if (!articleId || typeof isAllsvenskan !== "boolean") {
      return NextResponse.json({ error: "articleId and isAllsvenskan required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (!isAllsvenskan) {
      await supabase
        .from("articles")
        .update({ status: "filtered", manually_reviewed: true })
        .eq("id", articleId);
    } else {
      await supabase
        .from("articles")
        .update({
          status: "published",
          team_tags: teamSlugs,
          manually_reviewed: true,
        })
        .eq("id", articleId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
