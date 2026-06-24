import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import {
  deleteCatalogueCategory,
  renameCatalogueCategory,
} from "@/lib/vitrix/catalogue-categories";

type Ctx = { params: Promise<{ id: string }> };

function errorStatus(err: unknown) {
  const status = err && typeof err === "object" && "status" in err ? (err as { status?: unknown }).status : undefined;
  return typeof status === "number" ? status : 500;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name : "";

    const supabase = createAdminClient();
    const category = await renameCatalogueCategory(supabase, id, name);
    return NextResponse.json({ success: true, category });
  } catch (err) {
    await logVitrixError(err, "/api/vitrix/site-catalogue/categories/[id]");
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = errorStatus(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const supabase = createAdminClient();
    await deleteCatalogueCategory(supabase, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    await logVitrixError(err, "/api/vitrix/site-catalogue/categories/[id]");
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = errorStatus(err);
    return NextResponse.json({ error: message }, { status });
  }
}
