import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import {
  ensureCatalogueCategory,
  normalizeCatalogueCategoryName,
} from "@/lib/vitrix/catalogue-categories";
import { logVitrixError } from "@/lib/vitrix/logs";
import type { VitrixCatalogueRow } from "@/lib/vitrix/types";
import sharp from "sharp";

// GET /api/vitrix/site-catalogue
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    if (auth.local) {
      return NextResponse.json({ catalogue: [] });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("catalogue")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("site-catalogue GET error:", error);
      return NextResponse.json(
        { error: "Failed to fetch catalogue" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      catalogue: (data ?? []) as VitrixCatalogueRow[],
    });
  } catch (err) {
    console.error("GET /api/vitrix/site-catalogue error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function syncCatalogueAcrossLanguages(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    ref: string;
    lang: string;
    title: string;
    description: string | null;
    category: string;
    imgPath: string | null;
    imgPosition: string | null;
    status: string;
    sortOrder: number;
  },
) {
  const siblingLang = params.lang === "it" ? "en" : "it";
  const { data: sibling } = await supabase
    .from("catalogue")
    .select("id")
    .eq("ref", params.ref)
    .eq("lang", siblingLang)
    .maybeSingle();

  if (sibling) {
    const siblingUpdate: Record<string, string | number | null> = {
      title: params.title,
      description: params.description,
      category: params.category,
      status: params.status,
      sort_order: params.sortOrder,
    };
    if (params.imgPath) siblingUpdate.img_path = params.imgPath;
    if (params.imgPosition) siblingUpdate.img_position = params.imgPosition;
    await supabase.from("catalogue").update(siblingUpdate).eq("id", sibling.id);
  }
}

// POST /api/vitrix/site-catalogue
export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const formData = await req.formData();
    const ref = formData.get("ref") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = normalizeCatalogueCategoryName(String(formData.get("category") ?? ""));
    const imgPosition = formData.get("img_position") as string | null;
    const lang = (formData.get("lang") as string) || "it";
    const status = (formData.get("status") as string) || "draft";
    const requestedItemType = String(formData.get("item_type") ?? "");
    const itemType =
      requestedItemType === "collection"
        ? "collection"
        : requestedItemType === "item"
          ? "item"
          : category === "Parure"
            ? "collection"
            : "item";
    const parentIdRaw = formData.get("parent_id") as string | null;
    const parentId = parentIdRaw ? parseInt(parentIdRaw) : null;
    const sortOrder =
      formData.get("sort_order") != null
        ? parseInt(formData.get("sort_order") as string)
        : null;
    const file = formData.get("file") as File | null;
    const imgUrl = formData.get("img_url") as string | null;
    const collectionItemsJson =
      (formData.get("collection_items") as string | null) ??
      (formData.get("parure_items") as string | null);
    const collectionItems = collectionItemsJson ? JSON.parse(collectionItemsJson) : [];

    if (!ref || !title || !category) {
      return NextResponse.json(
        { error: "ref, title e category sono obbligatori" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const resolvedCategory = await ensureCatalogueCategory(supabase, category);

    // Determine sort_order if not provided
    let nextSortOrder = sortOrder;
    if (nextSortOrder === null) {
      const { data: maxRow } = await supabase
        .from("catalogue")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      nextSortOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;
    }

    // Optional image upload or URL
    let imgPath: string | null = null;
    if (file && file.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/avif",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Formato non supportato. Usa JPG, PNG o WebP." },
          { status: 400 },
        );
      }
      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const webpBuffer = await sharp(rawBuffer)
        .webp({ quality: 85 })
        .toBuffer();
      const fileId = crypto.randomUUID();
      const storagePath = `catalogue/${fileId}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("vitrix-media")
        .upload(storagePath, webpBuffer, {
          contentType: "image/webp",
          upsert: false,
        });
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        await logVitrixError(uploadError, "/api/vitrix/site-catalogue");
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 },
        );
      }
      const { data: urlData } = supabase.storage
        .from("vitrix-media")
        .getPublicUrl(storagePath);
      imgPath = urlData?.publicUrl ?? null;
    } else if (imgUrl) {
      imgPath = imgUrl;
    }

    const { data, error } = await supabase
      .from("catalogue")
      .insert({
        ref,
        title,
        description: description || null,
        category: resolvedCategory.name,
        img_path: imgPath,
        img_position: imgPosition || null,
        lang,
        status,
        sort_order: nextSortOrder,
        item_type: itemType,
        parent_id: itemType === "item" ? parentId : null,
        parure_id: itemType === "item" ? parentId : null,
      })
      .select()
      .single();

    if (error) {
      console.error("site-catalogue INSERT error:", error);
      await logVitrixError(error, "/api/vitrix/site-catalogue");
      return NextResponse.json(
        { error: "Failed to create catalogue item" },
        { status: 500 },
      );
    }

    if (data) {
      await syncCatalogueAcrossLanguages(supabase, {
        ref,
        lang,
        title,
        description: description || null,
        category: resolvedCategory.name,
        imgPath,
        imgPosition: imgPosition || null,
        status,
        sortOrder: nextSortOrder!,
      });
    }

    if (data && itemType === "collection" && collectionItems.length > 0) {
      const updatePromises = collectionItems.map((itemId: number) =>
        supabase
          .from("catalogue")
          .update({ parent_id: data.id, parure_id: data.id, item_type: "item" })
          .eq("id", itemId)
      );
      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      catalogue: data as VitrixCatalogueRow,
    });
  } catch (err) {
    console.error("POST /api/vitrix/site-catalogue error:", err);
    await logVitrixError(err, "/api/vitrix/site-catalogue");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
