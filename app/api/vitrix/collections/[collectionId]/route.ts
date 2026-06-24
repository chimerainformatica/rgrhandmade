import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import type { MediaCollection } from "@/lib/vitrix/types";

type Ctx = { params: Promise<{ collectionId: string }> };

// GET /api/vitrix/collections/[collectionId]
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    const { collectionId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("media_collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({ collection: data as MediaCollection });
  } catch (err) {
    console.error("GET /api/vitrix/collections/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/vitrix/collections/[collectionId]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId } = await params;
    const body = await req.json();
    const { name, slug, description, status, sort_order } = body;

    const supabase = createAdminClient();
    const update: Record<string, string | number | null> = { updated_at: new Date().toISOString() };
    if (name !== undefined) update.name = name;
    if (slug !== undefined) update.slug = (slug as string).toLowerCase().replace(/\s+/g, "-");
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (sort_order !== undefined) update.sort_order = sort_order;

    const { data, error } = await supabase
      .from("media_collections")
      .update(update)
      .eq("id", collectionId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
      }
      console.error("Update collection error:", error);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    return NextResponse.json({ success: true, collection: data as MediaCollection });
  } catch (err) {
    console.error("PATCH /api/vitrix/collections/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/vitrix/collections/[collectionId]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId } = await params;
    const supabase = createAdminClient();

    // Fetch all item storage paths before deletion
    const { data: items } = await supabase
      .from("media_collection_items")
      .select("storage_path")
      .eq("collection_id", collectionId);

    // Delete files from storage
    if (items && items.length > 0) {
      const paths = items.map((i) => i.storage_path);
      await supabase.storage.from("vitrix-media").remove(paths);
    }

    // Delete collection (cascade deletes items)
    const { error } = await supabase
      .from("media_collections")
      .delete()
      .eq("id", collectionId);

    if (error) {
      console.error("Delete collection error:", error);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vitrix/collections/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
