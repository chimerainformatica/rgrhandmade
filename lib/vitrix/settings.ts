import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { site } from "@/lib/content";
import type { VitrixSiteSettings } from "@/lib/vitrix/types";

const _siteName = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || site.name;
const _siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || site.url;
const _siteDescription =
  "Gioielli artigianali RGR Handmade: laboratorio orafo ad Arezzo, Made in Italy dal 1989.";

export const DEFAULT_SITE_SETTINGS: VitrixSiteSettings = {
  site_name: _siteName,
  seo_title: _siteName,
  seo_description: _siteDescription,
  canonical_url: _siteUrl,
  robots_index: true,
  robots_follow: true,
  og_title: _siteName,
  og_description: _siteDescription,
  og_image: null,
  favicon_path: "/uploads/vitrix/favicon-1779370634192.ico",
  default_language: "it",
  updated_at: null
};

const SETTINGS_ID = "global";

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeCanonicalUrl(value: unknown, fallback: string) {
  const normalized = normalizeText(value, fallback);
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return fallback;
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function normalizeOptionalPath(value: unknown, fallback: string | null) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("/") && !trimmed.startsWith("https://") && !trimmed.startsWith("http://")) return fallback;
  return trimmed;
}

function normalizeLanguage(value: unknown): "it" | "en" {
  return value === "en" ? "en" : "it";
}

export function normalizeSiteSettings(input: Partial<VitrixSiteSettings> | null | undefined): VitrixSiteSettings {
  return {
    site_name: normalizeText(input?.site_name, DEFAULT_SITE_SETTINGS.site_name),
    seo_title: normalizeText(input?.seo_title, DEFAULT_SITE_SETTINGS.seo_title),
    seo_description: normalizeText(input?.seo_description, DEFAULT_SITE_SETTINGS.seo_description),
    canonical_url: normalizeCanonicalUrl(input?.canonical_url, DEFAULT_SITE_SETTINGS.canonical_url),
    robots_index: typeof input?.robots_index === "boolean" ? input.robots_index : DEFAULT_SITE_SETTINGS.robots_index,
    robots_follow: typeof input?.robots_follow === "boolean" ? input.robots_follow : DEFAULT_SITE_SETTINGS.robots_follow,
    og_title: normalizeText(input?.og_title, input?.seo_title || DEFAULT_SITE_SETTINGS.og_title),
    og_description: normalizeText(input?.og_description, input?.seo_description || DEFAULT_SITE_SETTINGS.og_description),
    og_image: normalizeOptionalPath(input?.og_image, DEFAULT_SITE_SETTINGS.og_image),
    favicon_path: normalizeOptionalPath(input?.favicon_path, DEFAULT_SITE_SETTINGS.favicon_path),
    default_language: normalizeLanguage(input?.default_language),
    updated_at: input?.updated_at ?? null
  };
}

export async function getSiteSettings(): Promise<VitrixSiteSettings> {
  if (!getSupabaseConfig().hasServiceRole) return DEFAULT_SITE_SETTINGS;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("vitrix_site_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error || !data) return DEFAULT_SITE_SETTINGS;
    return normalizeSiteSettings(data as Partial<VitrixSiteSettings>);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function updateSiteSettings(input: Partial<VitrixSiteSettings>): Promise<VitrixSiteSettings> {
  const current = await getSiteSettings();
  const next = normalizeSiteSettings({ ...current, ...input, updated_at: new Date().toISOString() });
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("vitrix_site_settings")
    .upsert({ id: SETTINGS_ID, ...next }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSiteSettings(data as Partial<VitrixSiteSettings>);
}
