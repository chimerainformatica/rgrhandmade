import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";

type ReorderItem = {
  id: number;
  sort_order: number;
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const body = await req.json();
    const items = body?.items as ReorderItem[] | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const normalized = items.map((item, index) => ({
      id: Number(item.id),
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
    }));

    if (normalized.some((item) => !Number.isInteger(item.id))) {
      return NextResponse.json({ error: "Invalid collection id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify all IDs belong to existing catalogue items before updating
    const { data: validRows } = await supabase
      .from("catalogue")
      .select("id")
      .in("id", normalized.map(i => i.id));

    const validIds = new Set(validRows?.map(r => r.id) ?? []);
    const safeItems = normalized.filter(i => validIds.has(i.id));

    if (safeItems.length === 0) {
      return NextResponse.json({ error: "Invalid catalogue ids" }, { status: 400 });
    }

    const results = await Promise.all(
      safeItems.map(({ id, sort_order }) =>
        supabase
          .from("catalogue")
          .update({ sort_order })
          .eq("id", id),
      ),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      await logVitrixError(failed.error, "/api/vitrix/site-catalogue/reorder");
      return NextResponse.json({ error: "Failed to reorder catalogue" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/vitrix/site-catalogue/reorder error:", err);
    await logVitrixError(err, "/api/vitrix/site-catalogue/reorder");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
