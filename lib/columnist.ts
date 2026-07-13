/**
 * lib/columnist.ts — invite-only krönikörsroll.
 * `profiles.role` sätts manuellt (SQL) av founder — ingen self-serve-ansökan,
 * ingen admin-UI här (admin hör hemma i athopia-admin, inte athopia-web).
 * 'admin' har alltid tillgång — se lib/roles.ts.
 */
import { getCurrentRole, hasRole } from "@/lib/roles";

export interface ColumnistIdentity {
  userId: string;
  profileId: string;
}

/** Kräver inloggad användare med profiles.role='columnist' (eller admin). Null om ej behörig. */
export async function requireColumnist(): Promise<ColumnistIdentity | null> {
  const identity = await getCurrentRole();
  if (!identity || !hasRole(identity.role, "columnist")) return null;
  return { userId: identity.userId, profileId: identity.profileId };
}
