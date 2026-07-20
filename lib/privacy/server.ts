import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { DEFAULT_PRIVACY_CONFIG, normalizePrivacyConfig, type PrivacyConfig } from "@/lib/privacy/types";

const SETTINGS_ID = "default";

function synchronizeTechnicalServices(config: PrivacyConfig): PrivacyConfig {
  const turnstileActive = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) || process.env.TURNSTILE_ENABLED === "true";
  return {
    ...config,
    services: config.services.map((service) => service.id === "cloudflare-turnstile" ? { ...service, active: turnstileActive } : service),
  };
}

export async function getPublishedPrivacyConfig(): Promise<PrivacyConfig> {
  if (!getSupabaseConfig().hasServiceRole) return synchronizeTechnicalServices(DEFAULT_PRIVACY_CONFIG);

  try {
    const { data, error } = await createAdminClient()
      .from("vitrix_privacy_settings")
      .select("published_config,consent_version")
      .eq("id", SETTINGS_ID)
      .maybeSingle();
    if (error || !data?.published_config) return DEFAULT_PRIVACY_CONFIG;
    return synchronizeTechnicalServices(normalizePrivacyConfig(data.published_config, data.consent_version));
  } catch {
    return synchronizeTechnicalServices(DEFAULT_PRIVACY_CONFIG);
  }
}

export async function getPrivacyAdminState() {
  if (!getSupabaseConfig().hasServiceRole) {
    const fallback = synchronizeTechnicalServices(DEFAULT_PRIVACY_CONFIG);
    return { draft: fallback, published: fallback, history: [], consentCount: 0, publishedRevision: 1, updatedAt: null, publishedAt: null };
  }

  const supabase = createAdminClient();
  const [settings, history, consents] = await Promise.all([
    supabase.from("vitrix_privacy_settings").select("draft_config,published_config,published_revision,consent_version,updated_at,published_at").eq("id", SETTINGS_ID).maybeSingle(),
    supabase.from("vitrix_privacy_versions").select("revision,consent_version,published_at,published_by,requires_renewal").order("revision", { ascending: false }).limit(20),
    supabase.from("privacy_consent_receipts").select("receipt_id", { count: "exact", head: true }),
  ]);

  const version = settings.data?.consent_version ?? 1;
  return {
    draft: synchronizeTechnicalServices(normalizePrivacyConfig(settings.data?.draft_config, version)),
    published: synchronizeTechnicalServices(normalizePrivacyConfig(settings.data?.published_config, version)),
    history: history.data ?? [],
    consentCount: consents.count ?? 0,
    publishedRevision: settings.data?.published_revision ?? 1,
    updatedAt: settings.data?.updated_at ?? null,
    publishedAt: settings.data?.published_at ?? null,
  };
}
