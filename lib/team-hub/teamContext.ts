/**
 * lib/team-hub/teamContext.ts — Team-context-persistens (client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Sparar senast besökta lag i localStorage så att "Mitt lag"-fliken och
 * djupdyk-vyer kan defaulta till rätt lag oavsett ingångspunkt.
 * Lättviktig — ingen extern state-dependency (Zustand ej installerat).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const KEY = "athopia:currentTeam";

export interface StoredTeam {
  slug: string;
  name: string;
  logo_url?: string | null;
}

export function getStoredTeam(): StoredTeam | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredTeam) : null;
  } catch {
    return null;
  }
}

export function setStoredTeam(team: StoredTeam): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(team));
    // Notifiera lyssnare i samma flik (storage-eventet fyrar bara mellan flikar).
    window.dispatchEvent(new CustomEvent("athopia:team-change", { detail: team }));
  } catch {
    // ignore
  }
}
