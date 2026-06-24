import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import type { MediaCollectionItem } from "@/lib/vitrix/types";
import sharp from "sharp";

type Ctx = { params: Promise<{ collectionId: string; itemId: string }> };

function parseCropValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (value == null) return null;

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getBoundedCrop(
  imageWidth: number | undefined,
  imageHeight: number | undefined,
  crop: {
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
  },
) {
  if (!imageWidth || !imageHeight) return null;
  if (
    crop.x == null ||
    crop.y == null ||
    crop.width == null ||
    crop.height == null
  )
    return null;
  if (crop.width <= 0 || crop.height <= 0) return null;

  const left = Math.max(0, Math.min(crop.x, imageWidth - 1));
  const top = Math.max(0, Math.min(crop.y, imageHeight - 1));
  const width = Math.min(crop.width, imageWidth - left);
  const height = Math.min(crop.height, imageHeight - top);

  if (width <= 0 || height <= 0) return null;

  return { left, top, width, height };
}

async function buildWebpImage(
  file: File,
  crop: {
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
  },
) {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/tiff",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato non supportato. Usa JPG, PNG o WebP.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Max 10MB");
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const normalizedBuffer = await sharp(rawBuffer, { failOn: "none" })
    .rotate()
    .toBuffer();
  const inputMeta = await sharp(normalizedBuffer).metadata();
  let pipeline = sharp(normalizedBuffer, { failOn: "none" });
  const cropBox = getBoundedCrop(inputMeta.width, inputMeta.height, crop);
  if (cropBox) pipeline = pipeline.extract(cropBox);

  const webpBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
  const webpMeta = await sharp(webpBuffer).metadata();

  return {
    buffer: webpBuffer,
    width: webpMeta.width ?? null,
    height: webpMeta.height ?? null,
  };
}

// PATCH /api/vitrix/collections/[collectionId]/items/[itemId]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId, itemId } = await params;
    const supabase = createAdminClient();
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const existingStoragePath = formData.get("existing_storage_path") as
        | string
        | null;
      const title = formData.get("title");
      const description = formData.get("description");
      const altText = formData.get("alt_text");
      const category = formData.get("category");
      const tagsRaw = formData.get("tags");
      const status = formData.get("status");
      const publishedAt = formData.get("published_at");
      const slug = formData.get("slug");
      const sortOrder = formData.get("sort_order");

      if (title !== null) update.title = String(title);
      if (description !== null)
        update.description = String(description) || null;
      if (altText !== null) update.alt_text = String(altText) || null;
      if (category !== null) update.category = String(category) || null;
      if (tagsRaw !== null) {
        try {
          update.tags = JSON.parse(String(tagsRaw));
        } catch {
          update.tags = [];
        }
      }
      if (status !== null) update.status = String(status);
      if (publishedAt !== null)
        update.published_at = String(publishedAt) || null;
      if (slug !== null) update.slug = String(slug);
      if (sortOrder !== null)
        update.sort_order = Number.parseInt(String(sortOrder), 10);

      if (file && file.size > 0) {
        const { data: existing } = await supabase
          .from("media_collection_items")
          .select("storage_path")
          .eq("id", itemId)
          .eq("collection_id", collectionId)
          .single();

        const image = await buildWebpImage(file, {
          x: parseCropValue(formData, "crop_x"),
          y: parseCropValue(formData, "crop_y"),
          width: parseCropValue(formData, "crop_width"),
          height: parseCropValue(formData, "crop_height"),
        });
        const fileId = crypto.randomUUID();
        const storagePath = `collections/${collectionId}/${fileId}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("vitrix-media")
          .upload(storagePath, image.buffer, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          return NextResponse.json(
            {
              error: uploadError.message
                ? `Failed to upload file: ${uploadError.message}`
                : "Failed to upload file",
            },
            { status: 500 },
          );
        }

        const { data: urlData } = supabase.storage
          .from("vitrix-media")
          .getPublicUrl(storagePath);
        update.storage_path = storagePath;
        update.url = urlData?.publicUrl || "";
        update.width = image.width;
        update.height = image.height;
        update.size_bytes = image.buffer.length;

        if (existing?.storage_path) {
          await supabase.storage
            .from("vitrix-media")
            .remove([existing.storage_path]);
        }
      } else if (existingStoragePath) {
        const { data: existing } = await supabase
          .from("media_collection_items")
          .select("storage_path")
          .eq("id", itemId)
          .eq("collection_id", collectionId)
          .single();

        const { data: urlData } = supabase.storage
          .from("vitrix-media")
          .getPublicUrl(existingStoragePath);
        update.storage_path = existingStoragePath;
        update.url = urlData?.publicUrl || "";
        update.width = null;
        update.height = null;
        update.size_bytes = null;

        if (
          existing?.storage_path &&
          existing.storage_path !== existingStoragePath
        ) {
          await supabase.storage
            .from("vitrix-media")
            .remove([existing.storage_path]);
        }
      }
    } else {
      const body = await req.json();
      const {
        title,
        description,
        alt_text,
        category,
        tags,
        status,
        published_at,
        slug,
        sort_order,
      } = body;
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (alt_text !== undefined) update.alt_text = alt_text;
      if (category !== undefined) update.category = category;
      if (tags !== undefined) update.tags = tags;
      if (status !== undefined) update.status = status;
      if (published_at !== undefined) update.published_at = published_at;
      if (slug !== undefined) update.slug = slug;
      if (sort_order !== undefined) update.sort_order = sort_order;
    }

    const { data, error } = await supabase
      .from("media_collection_items")
      .update(update)
      .eq("id", itemId)
      .eq("collection_id", collectionId)
      .select()
      .single();

    if (error) {
      console.error("Update item error:", error);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      item: data as MediaCollectionItem,
    });
  } catch (err) {
    console.error(
      "PATCH /api/vitrix/collections/[id]/items/[itemId] error:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/vitrix/collections/[collectionId]/items/[itemId]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId, itemId } = await params;
    const supabase = createAdminClient();

    const { data: item, error: selectError } = await supabase
      .from("media_collection_items")
      .select("storage_path")
      .eq("id", itemId)
      .eq("collection_id", collectionId)
      .single();

    if (selectError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await supabase.storage.from("vitrix-media").remove([item.storage_path]);

    const { error: deleteError } = await supabase
      .from("media_collection_items")
      .delete()
      .eq("id", itemId)
      .eq("collection_id", collectionId);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      "DELETE /api/vitrix/collections/[id]/items/[itemId] error:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
