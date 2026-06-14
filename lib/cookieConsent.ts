export type CookieCategory = "necessary" | "analytics" | "marketing";

export interface CookieConsent {
  necessary: true; // alltid sant
  analytics: boolean;
  marketing: boolean;
  version: number; // bumpa när du lägger till ny kategori
  savedAt: string; // ISO-timestamp
}

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "athopia_cookie_consent";

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // Ogiltigförklara om version är äldre
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeConsent(consent: Omit<CookieConsent, "version" | "savedAt">): CookieConsent {
  const full: CookieConsent = {
    ...consent,
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
  return full;
}

export function hasConsented(): boolean {
  return getStoredConsent() !== null;
}

/** Aktiverar analytics-scripts — utöka vid behov */
export function applyConsent(consent: CookieConsent) {
  if (consent.analytics) {
    // Platshållare: ladda analytics-script här
    // loadGoogleAnalytics();
  }
}
