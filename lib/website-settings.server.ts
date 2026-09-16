import { unstable_cache } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_WEBSITE_SETTINGS,
  WEBSITE_CONFIG_KEY,
  parseWebsiteSettings,
  type WebsiteSettings,
} from "@/lib/website-settings";

async function loadWebsiteSettings(): Promise<WebsiteSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_WEBSITE_SETTINGS;
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("system_config")
      .select("value")
      .eq("key", WEBSITE_CONFIG_KEY)
      .maybeSingle();
    if (error || data == null) return DEFAULT_WEBSITE_SETTINGS;
    return parseWebsiteSettings((data as { value: unknown }).value);
  } catch {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

/** 60 s cache — admin-ändringar syns på sajten inom en minut, utan att varje request slår DB. */
export const getWebsiteSettings = unstable_cache(loadWebsiteSettings, ["website-settings"], {
  revalidate: 60,
});
