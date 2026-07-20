import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getPublishedPrivacyConfig } from "@/lib/privacy/server";
import { normalizeConsentChoices } from "@/lib/privacy/consent";
import { isAllowedContactOrigin } from "@/lib/contact-security";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isAllowedContactOrigin(request)) return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const receiptId = typeof body?.receiptId === "string" ? body.receiptId : "";
  const version = typeof body?.version === "number" ? body.version : Number(body?.version);
  const choices = normalizeConsentChoices(body?.choices);
  if (!UUID_RE.test(receiptId) || !Number.isInteger(version) || !choices) {
    return NextResponse.json({ error: "Preferenze non valide." }, { status: 400 });
  }

  const config = await getPublishedPrivacyConfig();
  if (version !== config.version) return NextResponse.json({ error: "Informativa aggiornata.", currentVersion: config.version }, { status: 409 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.consentValidityDays * 86_400_000);
  const deleteAfter = new Date(now);
  deleteAfter.setMonth(deleteAfter.getMonth() + config.receiptRetentionMonths);

  if (!getSupabaseConfig().hasServiceRole) {
    return NextResponse.json({ ok: true, persisted: false, expiresAt: expiresAt.toISOString() });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("privacy_consent_receipts").upsert({
    receipt_id: receiptId,
    policy_version: config.version,
    choices,
    updated_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    delete_after: deleteAfter.toISOString(),
  }, { onConflict: "receipt_id" });

  if (error) {
    console.error("Privacy consent persistence error", error.message);
    return NextResponse.json({ error: "Impossibile registrare le preferenze." }, { status: 503 });
  }

  void supabase.from("privacy_consent_receipts").delete().lt("delete_after", now.toISOString());
  return NextResponse.json({ ok: true, persisted: true, expiresAt: expiresAt.toISOString() });
}
