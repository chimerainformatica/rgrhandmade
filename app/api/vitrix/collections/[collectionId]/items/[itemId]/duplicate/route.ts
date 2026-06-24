import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import type { MediaCollectionItem } from "@/lib/vitrix/types";

type Ctx = { params: Promise<{ collectionId: string; itemId: string }> };

// POST /api/vitrix/collections/[collectionId]/items/[itemId]/duplicate
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId, itemId } = await params;
    const supabase = createAdminClient();

    // Fetch original item
    const { data: original, error: selectError } = await supabase
      .from("media_collection_items")
      .select("*")
      .eq("id", itemId)
      .eq("collection_id", collectionId)
      .single();

    if (selectError || !original) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Copy file in storage
    const newFileId = crypto.randomUUID();
    const newStoragePath = `collections/${collectionId}/${newFileId}.webp`;

    const { error: copyError } = await supabase.storage
      .from("vitrix-media")
      .copy(original.storage_path, newStoragePath);

    if (copyError) {
      console.error("Storage copy error:", copyError);
      return NextResponse.json({ error: "Failed to copy file" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("vitrix-media").getPublicUrl(newStoragePath);
    const publicUrl = urlData?.publicUrl || "";

    // Get next sort_order
    const { data: maxSort } = await supabase
      .from("media_collection_items")
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSortOrder = (maxSort?.[0]?.sort_order ?? -1) + 1;

    const newSlug = original.slug + "-copy-" + newFileId.substring(0, 8);

    const { data, error: insertError } = await supabase
      .from("media_collection_items")
      .insert({
        collection_id: collectionId,
        title: original.title + " (copia)",
        description: original.description,
        alt_text: original.alt_text,
        tags: original.tags,
        category: original.category,
        status: "draft",
        published_at: null,
        slug: newSlug,
        storage_path: newStoragePath,
        url: publicUrl,
        width: original.width,
        height: original.height,
        size_bytes: original.size_bytes,
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert duplicate error:", insertError);
      await supabase.storage.from("vitrix-media").remove([newStoragePath]);
      return NextResponse.json({ error: "Failed to duplicate item" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data as MediaCollectionItem });
  } catch (err) {
    console.error("POST duplicate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
