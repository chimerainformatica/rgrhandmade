import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VitrixCatalogueRow } from "@/lib/vitrix/types";

/**
 * GET /api/catalogue
 * PUBLIC API - Returns published catalogue items for the frontend
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("catalogue")
      .select("id, ref, title, description, category, img_path, img_position, lang, status, sort_order, item_type, parent_id, parure_id, created_at")
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("GET /api/catalogue error:", error);
      return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 });
    }

    return NextResponse.json({
      catalogue: (data ?? []) as Partial<VitrixCatalogueRow>[],
      count: (data ?? []).length
    });
  } catch (err) {
    console.error("GET /api/catalogue error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
