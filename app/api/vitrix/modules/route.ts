import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import type { AdminModuleId } from "@/lib/admin-modules";
import type { VitrixModuleRow } from "@/lib/vitrix/types";

const LOCKED_MODULES = new Set<AdminModuleId>(["dashboard", "settings", "users"]);
const MODULE_IDS = new Set<AdminModuleId>(["dashboard", "catalogue", "events", "media", "settings", "widgets", "privacy", "users"]);

function isAdminModuleId(value: unknown): value is AdminModuleId {
  return typeof value === "string" && MODULE_IDS.has(value as AdminModuleId);
}

function normalizeModuleRow(row: VitrixModuleRow | (Omit<VitrixModuleRow, "id"> & { id: string })): VitrixModuleRow | null {
  const id = row.id === "press" ? "events" : row.id;
  if (!isAdminModuleId(id)) return null;
  return {
    ...row,
    id,
    label: id === "events" ? "Eventi" : row.label,
    description: id === "events" ? "Gestione eventi, fiere, press e contenuti editoriali." : row.description,
  };
}

export async function GET() {
  const auth = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in auth) return auth.response;

  if (auth.local) {
    return NextResponse.json({ modules: [] });
  }

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vitrix_modules")
    .select("id,label,description,enabled,sort_order")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const modules = ((data ?? []) as (Omit<VitrixModuleRow, "id"> & { id: string })[])
    .map(normalizeModuleRow)
    .filter((row): row is VitrixModuleRow => Boolean(row));
  return NextResponse.json({ modules });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in auth) return auth.response;

  if (auth.local) {
    return NextResponse.json({ error: "Supabase non configurato." }, { status: 400 });
  }

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id === "press" ? "events" : body?.id;
  const enabled = body?.enabled;

  if (!isAdminModuleId(id) || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Payload modulo non valido." }, { status: 400 });
  }

  if (LOCKED_MODULES.has(id) && !enabled) {
    return NextResponse.json({ error: "Dashboard, Impostazioni e Utenti non possono essere disabilitati." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vitrix_modules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,label,description,enabled,sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ module: data as VitrixModuleRow });
}
