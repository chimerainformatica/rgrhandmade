import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaCollectionItem } from "@/lib/vitrix/types";

/**
 * GET /api/catalogue/[catalogueId]/items
 * PUBLIC API - Returns published items from a catalogue
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId: catalogueId } = await params;

    if (!catalogueId) {
      return NextResponse.json({ error: "Catalogue ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify catalogue exists and is published
    const { data: catalogue, error: catalogueError } = await supabase
      .from("catalogue")
      .select("id, status")
      .eq("id", catalogueId)
      .single();

    if (catalogueError || !catalogue || catalogue.status !== "published") {
      return NextResponse.json({ error: "Catalogue not found or not published" }, { status: 404 });
    }

    // Get published items
    const { data, error } = await supabase
      .from("catalogue_items")
      .select("*")
      .eq("catalogue_id", catalogueId)
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("GET /api/catalogue/items error:", error);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    return NextResponse.json({
      catalogueId,
      items: (data ?? []) as MediaCollectionItem[],
      count: (data ?? []).length
    });
  } catch (err) {
    console.error("GET /api/catalogue/items error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
