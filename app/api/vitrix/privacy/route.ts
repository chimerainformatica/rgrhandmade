import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getPrivacyAdminState } from "@/lib/privacy/server";
import { normalizePrivacyConfig, validatePrivacyConfigInput } from "@/lib/privacy/types";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { isAllowedContactOrigin } from "@/lib/contact-security";

function connectorError(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const connectors = (body as { connectors?: Record<string, { enabled?: unknown; measurementId?: unknown; pixelId?: unknown }> }).connectors;
  if (connectors?.ga4?.enabled === true && (typeof connectors.ga4.measurementId !== "string" || !/^G-[A-Z0-9]{4,20}$/i.test(connectors.ga4.measurementId.trim()))) return "Measurement ID GA4 non valido.";
  if (connectors?.metaPixel?.enabled === true && (typeof connectors.metaPixel.pixelId !== "string" || !/^\d{5,25}$/.test(connectors.metaPixel.pixelId.trim()))) return "Pixel ID Meta non valido.";
  return null;
}

export async function GET() {
  const guard = await requireVitrixApiPermission("vitrix.privacy.manage");
  if ("response" in guard) return guard.response;
  return NextResponse.json(await getPrivacyAdminState());
}

export async function PUT(request: Request) {
  if (!isAllowedContactOrigin(request)) return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });
  const guard = await requireVitrixApiPermission("vitrix.privacy.manage");
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Configurazione non valida." }, { status: 400 });
  const validationErrors = validatePrivacyConfigInput(body);
  if (validationErrors.length) return NextResponse.json({ error: validationErrors[0], errors: validationErrors }, { status: 400 });
  const invalidConnector = connectorError(body);
  if (invalidConnector) return NextResponse.json({ error: invalidConnector }, { status: 400 });
  const config = normalizePrivacyConfig(body);

  if (!getSupabaseConfig().hasServiceRole) return NextResponse.json({ config, persisted: false });
  const { data, error } = await createAdminClient().from("vitrix_privacy_settings").upsert({
    id: "default",
    config_schema_version: 2,
    draft_config: config,
    updated_by: guard.user?.id ?? null,
    updated_at: new Date().toISOString(),
  }).select("draft_config,updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/privacy");
  return NextResponse.json({ config: normalizePrivacyConfig(data.draft_config), updatedAt: data.updated_at, persisted: true });
}
