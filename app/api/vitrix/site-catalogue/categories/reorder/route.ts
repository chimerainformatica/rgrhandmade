import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import { reorderCatalogueCategories } from "@/lib/vitrix/catalogue-categories";

type ReorderItem = {
  id: string;
  sort_order: number;
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const items = body?.items as ReorderItem[] | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const normalized = items
      .map((item, index) => ({
        id: String(item.id),
        sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
      }))
      .filter((item) => item.id.trim().length > 0);

    if (normalized.length === 0) {
      return NextResponse.json({ error: "Invalid category ids" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await reorderCatalogueCategories(supabase, normalized);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/vitrix/site-catalogue/categories/reorder error:", err);
    await logVitrixError(err, "/api/vitrix/site-catalogue/categories/reorder");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
