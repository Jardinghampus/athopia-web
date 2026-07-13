/**
 * lib/columnist.ts — invite-only krönikörsroll.
 * `profiles.role` sätts manuellt (SQL) av founder — ingen self-serve-ansökan,
 * ingen admin-UI här (admin hör hemma i athopia-admin, inte athopia-web).
 */
import { auth } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export interface ColumnistIdentity {
  userId: string;
  profileId: string;
}

/** Kräver inloggad användare med profiles.role='columnist'. Null om ej behörig. */
export async function requireColumnist(): Promise<ColumnistIdentity | null> {
  const { userId } = await auth();
  if (!userId || !isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db
    .from("profiles")
    .select("id, role")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!data || data.role !== "columnist") return null;
  return { userId, profileId: String(data.id) };
}
