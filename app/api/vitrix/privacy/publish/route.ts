import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { isConsentMaterialChange, normalizePrivacyConfig } from "@/lib/privacy/types";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { isAllowedContactOrigin } from "@/lib/contact-security";

export async function POST(request: Request) {
  if (!isAllowedContactOrigin(request)) return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });
  const guard = await requireVitrixApiPermission("vitrix.privacy.manage");
  if ("response" in guard) return guard.response;
  if (!getSupabaseConfig().hasServiceRole) return NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 });

  const supabase = createAdminClient();
  const { data: row, error: readError } = await supabase.from("vitrix_privacy_settings")
    .select("draft_config,published_config,published_revision,consent_version")
    .eq("id", "default")
    .single();
  if (readError || !row) return NextResponse.json({ error: readError?.message ?? "Configurazione non trovata." }, { status: 500 });

  const draft = normalizePrivacyConfig(row.draft_config, row.consent_version);
  const published = normalizePrivacyConfig(row.published_config, row.consent_version);
  const requiresRenewal = isConsentMaterialChange(published, draft);
  const revision = row.published_revision + 1;
  const consentVersion = row.consent_version + (requiresRenewal ? 1 : 0);
  const publishedConfig = normalizePrivacyConfig(draft, consentVersion);
  const now = new Date().toISOString();

  const { error: updateError } = await supabase.from("vitrix_privacy_settings").update({
    draft_config: publishedConfig,
    published_config: publishedConfig,
    published_revision: revision,
    consent_version: consentVersion,
    published_at: now,
    published_by: guard.user?.id ?? null,
    updated_by: guard.user?.id ?? null,
    updated_at: now,
  }).eq("id", "default");
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: historyError } = await supabase.from("vitrix_privacy_versions").insert({
    revision,
    consent_version: consentVersion,
    config: publishedConfig,
    requires_renewal: requiresRenewal,
    published_at: now,
    published_by: guard.user?.id ?? null,
  });
  if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });

  revalidatePath("/", "layout");
  revalidatePath("/privacy-policy");
  revalidatePath("/cookie-policy");
  return NextResponse.json({ config: publishedConfig, revision, consentVersion, requiresRenewal, publishedAt: now });
}
