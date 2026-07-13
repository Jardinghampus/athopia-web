/**
 * lib/roles.ts — profiles.role-konvention för hela repot.
 *
 * 'admin' är wildcard: varje behörighetskontroll som skrivs mot hasRole()
 * ger admin tillgång automatiskt, utan att varje gate behöver känna till
 * admin-fallet själv. Sätts manuellt (SQL) av founder, ingen self-serve,
 * ingen admin-UI i detta repo (athopia-admin äger administrationsytor).
 *
 * Detta skyddar bara kod som faktiskt anropar hasRole()/requireRole() —
 * det är ingen magisk global bypass för rutter som saknar rollkontroll helt.
 * Nya invite-only-funktioner ska bygga sin gate ovanpå denna, som
 * lib/columnist.ts gör, så admin automatiskt får tillgång till dem också.
 */
import { auth } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type ProfileRole = "reader" | "columnist" | "admin";

export function hasRole(role: ProfileRole | null | undefined, required: ProfileRole): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return role === required;
}

export interface RoleIdentity {
  userId: string;
  profileId: string;
  role: ProfileRole;
}

/** Hämtar inloggad användares roll. Null om ej inloggad/konfigurerad. */
export async function getCurrentRole(): Promise<RoleIdentity | null> {
  const { userId } = await auth();
  if (!userId || !isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db
    .from("profiles")
    .select("id, role")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { userId, profileId: String(data.id), role: (data.role as ProfileRole) ?? "reader" };
}
