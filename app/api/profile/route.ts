import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function db() {
  return createServerClient();
}

// GET /api/profile — egen fullständig profil (privat)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  if (!isSupabaseConfigured()) return NextResponse.json({ profile: null });

  const { data } = await db()
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return NextResponse.json({
    profile: data ?? null,
    email: user?.emailAddresses?.[0]?.emailAddress ?? null,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    imageUrl: user?.imageUrl ?? null,
  });
}

// PATCH /api/profile — uppdatera egen profil, sync till Clerk + spegla till profiles
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 500 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 280) : undefined;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : undefined;
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : undefined;
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url : undefined;

  // Nickname-validering + unikhet (case-insensitivt, exkl. en själv)
  if (nickname !== undefined && nickname.length > 0) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(nickname)) {
      return NextResponse.json(
        { error: "Nickname: 3–20 tecken, endast bokstäver, siffror och _" },
        { status: 400 }
      );
    }
    const { data: taken } = await db()
      .from("profiles")
      .select("clerk_user_id")
      .ilike("nickname", nickname)
      .neq("clerk_user_id", userId)
      .maybeSingle();
    if (taken) {
      return NextResponse.json({ error: "Nickname är upptaget", field: "nickname" }, { status: 409 });
    }
  }

  // Sync namn till Clerk (sanning för auth-fält)
  if (firstName !== undefined || lastName !== undefined) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
      });
    } catch {
      return NextResponse.json({ error: "Kunde inte uppdatera namn i Clerk" }, { status: 502 });
    }
  }

  // Spegla publika fält till profiles
  const user = await currentUser();
  const update: Record<string, unknown> = {
    clerk_user_id: userId,
    display_name:
      [firstName ?? user?.firstName, lastName ?? user?.lastName].filter(Boolean).join(" ") || null,
  };
  if (nickname !== undefined) update.nickname = nickname || null;
  if (bio !== undefined) update.bio = bio || null;
  if (avatarUrl !== undefined) update.avatar_url = avatarUrl;

  const { error } = await db().from("profiles").upsert(update, { onConflict: "clerk_user_id" });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Nickname är upptaget", field: "nickname" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
