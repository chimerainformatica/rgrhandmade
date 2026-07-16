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

    let parentTranslationGroupId: string | null = null;
    let siblingParentId: number | null = null;
    if (itemType === "item" && parentId) {
      const { data: parent } = await supabase
        .from("catalogue")
        .select("translation_group_id")
        .eq("id", parentId)
        .maybeSingle();
      parentTranslationGroupId = parent?.translation_group_id ?? null;
      if (parentTranslationGroupId) {
        const { data: siblingParent } = await supabase
          .from("catalogue")
          .select("id")
          .eq("translation_group_id", parentTranslationGroupId)
          .eq("lang", lang === "it" ? "en" : "it")
          .maybeSingle();
        siblingParentId = siblingParent?.id ?? null;
      }
    }

    const translationGroupId = crypto.randomUUID();
    const shared = {
      ref,
      category: resolvedCategory.name,
      img_path: imgPath,
      img_position: imgPosition || null,
      sort_order: nextSortOrder,
      item_type: itemType,
      translation_group_id: translationGroupId,
      parent_translation_group_id: parentTranslationGroupId,
    };
    const { data: createdRows, error } = await supabase
      .from("catalogue")
      .insert([
        {
          ...shared,
          title,
          description: description || null,
          lang,
          status,
          parent_id: itemType === "item" ? parentId : null,
          parure_id: itemType === "item" ? parentId : null,
        },
        {
          ...shared,
          title,
          description: description || null,
          lang: lang === "it" ? "en" : "it",
          status: "draft",
          parent_id: itemType === "item" ? siblingParentId : null,
          parure_id: itemType === "item" ? siblingParentId : null,
        },
      ])
      .select();

    if (error) {
      console.error("site-catalogue INSERT error:", error);
      await logVitrixError(error, "/api/vitrix/site-catalogue");
      return NextResponse.json(
        { error: "Failed to create catalogue item" },
        { status: 500 },
      );
    }

    const rows = (createdRows ?? []) as VitrixCatalogueRow[];
    const data = rows.find((row) => row.lang === lang) ?? rows[0];

    if (data && itemType === "collection" && collectionItems.length > 0) {
      const { data: selectedItems } = await supabase
        .from("catalogue")
        .select("translation_group_id")
        .in("id", collectionItems);
      const childGroups = Array.from(new Set((selectedItems ?? []).map((item) => item.translation_group_id)));
      await Promise.all(rows.flatMap((parent) => childGroups.map((groupId) =>
        supabase
          .from("catalogue")
          .update({
            parent_id: parent.id,
            parure_id: parent.id,
            parent_translation_group_id: translationGroupId,
            item_type: "item",
          })
          .eq("translation_group_id", groupId)
          .eq("lang", parent.lang)
      )));
    }

    return NextResponse.json({
      success: true,
      catalogue: data as VitrixCatalogueRow,
      translations: rows,
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
