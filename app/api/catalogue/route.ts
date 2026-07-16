import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VitrixCatalogueRow } from "@/lib/vitrix/types";

/**
 * GET /api/catalogue
 * PUBLIC API - Returns published catalogue items for the frontend
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const requestedLang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "it";
    const { data, error } = await supabase
      .from("catalogue")
      .select("id, translation_group_id, parent_translation_group_id, ref, title, description, category, img_path, img_position, lang, status, sort_order, item_type, parent_id, parure_id, created_at")
      .eq("status", "published")
      .in("lang", requestedLang === "en" ? ["en", "it"] : ["it"])
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("GET /api/catalogue error:", error);
      return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 });
    }

    const localized = Array.from(
      ((data ?? []) as VitrixCatalogueRow[]).reduce((groups, row) => {
        const key = row.translation_group_id || String(row.id);
        const current = groups.get(key);
        if (!current || (row.lang === requestedLang && current.lang !== requestedLang)) groups.set(key, row);
        return groups;
      }, new Map<string, VitrixCatalogueRow>()),
    ).map(([, row]) => row);

    const selectedByGroup = new Map(localized.map((row) => [row.translation_group_id, row]));
    const { data: categoryRows } = await supabase
      .from("catalogue_categories")
      .select("name,name_en");
    const categoryLabels = new Map((categoryRows ?? []).map((category) => [category.name, category]));
    const normalized = localized.map((row) => {
      const parent = row.parent_translation_group_id
        ? selectedByGroup.get(row.parent_translation_group_id)
        : null;
      const category = categoryLabels.get(row.category);
      const localizedRow = {
        ...row,
        category_label: requestedLang === "en" ? category?.name_en || row.category : category?.name || row.category,
      };
      return parent ? { ...localizedRow, parent_id: parent.id, parure_id: parent.id } : localizedRow;
    });

    return NextResponse.json({ catalogue: normalized, count: normalized.length });
  } catch (err) {
    console.error("GET /api/catalogue error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
