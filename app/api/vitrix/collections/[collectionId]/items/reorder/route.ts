import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";

type Ctx = { params: Promise<{ collectionId: string }> };

// POST /api/vitrix/collections/[collectionId]/items/reorder
// Body: { items: [{ id: string, sort_order: number }] }
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId } = await params;
    const body = await req.json();
    const { items } = body as { items: { id: string; sort_order: number }[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    await Promise.all(
      items.map(({ id, sort_order }) =>
        supabase
          .from("media_collection_items")
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("collection_id", collectionId)
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST reorder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
