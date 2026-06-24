import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import type { MediaCollectionItem } from "@/lib/vitrix/types";
import sharp from "sharp";

type Ctx = { params: Promise<{ collectionId: string }> };

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "item";
}

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

// GET /api/vitrix/collections/[collectionId]/items
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    if (auth.local) {
      return NextResponse.json({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        categories: [],
        tags: [],
      });
    }

    const { collectionId } = await params;
    const supabase = createAdminClient();
    const url = new URL(req.url);

    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("media_collection_items")
      .select("*", { count: "exact" })
      .eq("collection_id", collectionId);

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (tag) query = query.contains("tags", [tag]);
    if (search)
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    query = query
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Items query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 },
      );
    }

    const { data: allItems } = await supabase
      .from("media_collection_items")
      .select("category, tags")
      .eq("collection_id", collectionId);

    const categories = Array.from(
      new Set((allItems ?? []).map((r) => r.category).filter(Boolean)),
    ) as string[];

    const allTags = (allItems ?? []).flatMap((r) => r.tags ?? []);
    const tags = Array.from(new Set(allTags)).sort();

    return NextResponse.json({
      items: (data ?? []) as MediaCollectionItem[],
      total: count ?? 0,
      page,
      limit,
      categories,
      tags,
    });
  } catch (err) {
    console.error("GET /api/vitrix/collections/[id]/items error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/vitrix/collections/[collectionId]/items
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const { collectionId } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const existingStoragePath = formData.get("existing_storage_path") as
      | string
      | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const altText = formData.get("alt_text") as string | null;
    const category = formData.get("category") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const VALID_ITEM_STATUSES = ["draft", "published"] as const;
    const rawStatus = (formData.get("status") as string) || "draft";
    const status = (VALID_ITEM_STATUSES as readonly string[]).includes(
      rawStatus,
    )
      ? rawStatus
      : "draft";
    const publishedAt = formData.get("published_at") as string | null;
    const slug = formData.get("slug") as string | null;

    // Coordinate crop in pixel sull'immagine originale (opzionali)
    const cropX = parseCropValue(formData, "crop_x");
    const cropY = parseCropValue(formData, "crop_y");
    const cropW = parseCropValue(formData, "crop_width");
    const cropH = parseCropValue(formData, "crop_height");

    if (!file && !existingStoragePath) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/tiff",
    ];
    if (file && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato non supportato. Usa JPG, PNG o WebP." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    let storagePath = existingStoragePath;
    let publicUrl = "";
    let finalWidth: number | null = null;
    let finalHeight: number | null = null;
    let sizeBytes: number | null = null;
    const generatedSlug = slug
      ? slugify(slug)
      : `${slugify(title)}-${crypto.randomUUID().substring(0, 8)}`;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Max 10MB" },
          { status: 400 },
        );
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const normalizedBuffer = await sharp(rawBuffer, { failOn: "none" })
        .rotate()
        .toBuffer();
      const inputMeta = await sharp(normalizedBuffer).metadata();
      let pipeline = sharp(normalizedBuffer, { failOn: "none" });
      const cropBox = getBoundedCrop(inputMeta.width, inputMeta.height, {
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      });
      if (cropBox) {
        pipeline = pipeline.extract(cropBox);
      }
      const webpBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
      const webpMeta = await sharp(webpBuffer).metadata();
      finalWidth = webpMeta.width ?? null;
      finalHeight = webpMeta.height ?? null;
      sizeBytes = webpBuffer.length;

      const fileId = crypto.randomUUID();
      storagePath = `collections/${collectionId}/${fileId}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("vitrix-media")
        .upload(storagePath, webpBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
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
      publicUrl = urlData?.publicUrl || "";
    } else if (existingStoragePath) {
      const { data: urlData } = supabase.storage
        .from("vitrix-media")
        .getPublicUrl(existingStoragePath);
      publicUrl = urlData?.publicUrl || "";
      sizeBytes = null;
      finalWidth = null;
      finalHeight = null;
    }

    if (!storagePath) {
      return NextResponse.json(
        { error: "No storage path available" },
        { status: 400 },
      );
    }

    const { data: maxSort } = await supabase
      .from("media_collection_items")
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSortOrder = (maxSort?.[0]?.sort_order ?? -1) + 1;

    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        tags = [];
      }
    }

    const { data, error: insertError } = await supabase
      .from("media_collection_items")
      .insert({
        collection_id: collectionId,
        title,
        description: description || null,
        alt_text: altText || null,
        tags,
        category: category || null,
        status,
        published_at: publishedAt || new Date().toISOString(),
        slug: generatedSlug,
        storage_path: storagePath,
        url: publicUrl,
        width: finalWidth,
        height: finalHeight,
        size_bytes: sizeBytes,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      if (file && storagePath) {
        await supabase.storage.from("vitrix-media").remove([storagePath]);
      }
      return NextResponse.json(
        { error: "Failed to save item metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      item: data as MediaCollectionItem,
    });
  } catch (err) {
    console.error("POST /api/vitrix/collections/[id]/items error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
