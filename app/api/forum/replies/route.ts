import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ message: "Ej inloggad" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ message: "DB ej konfigurerad" }, { status: 503 });
    }

    const body = await req.json() as {
      thread_id?: string;
      content?: string;
      author_id?: string;
      author_name?: string;
    };

    const { thread_id, content, author_id, author_name } = body;

    if (!thread_id || !content?.trim()) {
      return NextResponse.json({ message: "Saknade fält: thread_id, content" }, { status: 400 });
    }
    if (author_id !== user.id) {
      return NextResponse.json({ message: "Ogiltig author_id" }, { status: 403 });
    }
    if (content.trim().length > 5000) {
      return NextResponse.json({ message: "Svar får max vara 5000 tecken" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Kontrollera att tråden finns och ej är låst
    const { data: thread, error: threadErr } = await supabase
      .from("forum_threads")
      .select("id, locked")
      .eq("id", thread_id)
      .single();

    if (threadErr || !thread) {
      return NextResponse.json({ message: "Tråden hittades inte" }, { status: 404 });
    }
    if ((thread as { locked: boolean }).locked) {
      return NextResponse.json({ message: "Tråden är låst" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("forum_replies")
      .insert({
        thread_id,
        content: content.trim(),
        author_id,
        author_name: author_name ?? user.fullName ?? user.username ?? "Anonym",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[forum/replies] insert error:", error);
      return NextResponse.json({ message: "Databasfel" }, { status: 500 });
    }

    return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 });
  } catch (err) {
    console.error("[forum/replies] unexpected error:", err);
    return NextResponse.json({ message: "Serverfel" }, { status: 500 });
  }
}
