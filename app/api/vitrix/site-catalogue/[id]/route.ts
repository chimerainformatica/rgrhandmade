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

type Ctx = { params: Promise<{ id: string }> };

async function syncCatalogueAcrossLanguages(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    ref: string;
    lang: string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    imgPath: string | null;
    imgPosition: string | null;
    status?: string | null;
    sortOrder?: number | null;
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
    const siblingUpdate: Record<string, string | number | null> = {};
    if (params.title) siblingUpdate.title = params.title;
    if (params.description !== undefined) siblingUpdate.description = params.description;
    if (params.category) siblingUpdate.category = params.category;
    if (params.imgPath) siblingUpdate.img_path = params.imgPath;
    if (params.imgPosition) siblingUpdate.img_position = params.imgPosition;
    if (params.status) siblingUpdate.status = params.status;
    if (params.sortOrder !== undefined && params.sortOrder !== null) siblingUpdate.sort_order = params.sortOrder;
    if (Object.keys(siblingUpdate).length > 0) {
      await supabase.from("catalogue").update(siblingUpdate).eq("id", sibling.id);
    }
  }
}

// PATCH /api/vitrix/site-catalogue/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const formData = await req.formData();

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("catalogue")
      .select("id,ref,lang,img_path,img_position,category,item_type,parent_id,parure_id")
      .eq("id", id)
      .maybeSingle();

    const update: Record<string, string | number | null> = {};

    const ref = formData.get("ref") as string | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const imgPosition = formData.get("img_position") as string | null;
    const lang = formData.get("lang") as string | null;
    const status = formData.get("status") as string | null;
    const itemTypeRaw = formData.get("item_type") as string | null;
    const parentIdRaw = formData.get("parent_id") as string | null;
    const sortOrderRaw = formData.get("sort_order") as string | null;
    const file = formData.get("file") as File | null;
    const imgUrl = formData.get("img_url") as string | null;
    const collectionItemsJson =
      (formData.get("collection_items") as string | null) ??
      (formData.get("parure_items") as string | null);
    const collectionItems = collectionItemsJson ? JSON.parse(collectionItemsJson) : [];

    if (ref !== null) update.ref = ref;
    if (title !== null) update.title = title;
    if (description !== null) update.description = description || null;
    if (category !== null) {
      const normalizedCategory = normalizeCatalogueCategoryName(category);
      if (!normalizedCategory) {
        return NextResponse.json(
          { error: "La categoria e obbligatoria." },
          { status: 400 },
        );
      }
      const resolvedCategory = await ensureCatalogueCategory(supabase, normalizedCategory);
      update.category = resolvedCategory.name;
    }
    if (imgPosition !== null) update.img_position = imgPosition || null;
    if (lang !== null) update.lang = lang;
    if (status !== null) update.status = status;
    if (itemTypeRaw === "collection" || itemTypeRaw === "item") {
      update.item_type = itemTypeRaw;
      if (itemTypeRaw === "collection") {
        update.parent_id = null;
        update.parure_id = null;
      }
    }
    if (parentIdRaw !== null && update.item_type !== "collection") {
      const parentId = parentIdRaw ? parseInt(parentIdRaw) : null;
      update.parent_id = parentId;
      update.parure_id = parentId;
    }
    if (sortOrderRaw !== null) update.sort_order = parseInt(sortOrderRaw);

    const currentRef = (ref ?? existing?.ref) ?? null;
    const currentLang = (lang ?? existing?.lang) ?? null;
    const currentImagePosition = imgPosition !== null ? (imgPosition || null) : existing?.img_position ?? null;

    // Optional image replace
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
        await logVitrixError(uploadError, "/api/vitrix/site-catalogue/[id]");
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 },
        );
      }
      const { data: urlData } = supabase.storage
        .from("vitrix-media")
        .getPublicUrl(storagePath);
      update.img_path = urlData?.publicUrl ?? null;
    } else if (imgUrl) {
      update.img_path = imgUrl;
    }

    if (!update.img_path && !file && !existing?.img_path && currentRef) {
      const siblingLang = currentLang === "it" ? "en" : "it";
      const { data: sibling } = await supabase
        .from("catalogue")
        .select("img_path,img_position")
        .eq("ref", currentRef)
        .eq("lang", siblingLang)
        .maybeSingle();

      if (sibling?.img_path) {
        update.img_path = sibling.img_path;
        if (!update.img_position && sibling.img_position) {
          update.img_position = sibling.img_position;
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Nessun campo da aggiornare" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("catalogue")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("site-collections PATCH error:", error);
      await logVitrixError(error, "/api/vitrix/site-catalogue/[id]");
      return NextResponse.json(
        { error: "Failed to update catalogue item" },
        { status: 500 },
      );
    }

    const resolvedImagePath =
      typeof update.img_path === "string"
        ? update.img_path
        : existing?.img_path ?? null;

    if (currentRef && currentLang) {
      await syncCatalogueAcrossLanguages(supabase, {
        ref: currentRef,
        lang: currentLang,
        title: title,
        description: description,
        category: (category !== null ? update.category : existing?.category) ?? null,
        imgPath: resolvedImagePath,
        imgPosition: (update.img_position as string | null) ?? currentImagePosition,
        status: status,
        sortOrder: sortOrderRaw !== null ? parseInt(sortOrderRaw) : null,
      });
    }

    const finalCategory = (category !== null ? update.category : existing?.category) ?? null;
    const finalItemType = (update.item_type as string | undefined) ?? existing?.item_type ?? (finalCategory === "Parure" ? "collection" : "item");
    if (finalItemType === "collection") {
      await supabase
        .from("catalogue")
        .update({ parent_id: null, parure_id: null })
        .or(`parent_id.eq.${parseInt(id)},parure_id.eq.${parseInt(id)}`);

      if (collectionItems.length > 0) {
        const updatePromises = collectionItems.map((itemId: number) =>
          supabase
            .from("catalogue")
            .update({ parent_id: parseInt(id), parure_id: parseInt(id), item_type: "item" })
            .eq("id", itemId)
        );
        await Promise.all(updatePromises);
      }
    } else if (existing?.item_type === "collection" || existing?.category === "Parure") {
      await supabase
        .from("catalogue")
        .update({ parent_id: null, parure_id: null })
        .or(`parent_id.eq.${parseInt(id)},parure_id.eq.${parseInt(id)}`);
    }

    return NextResponse.json({
      success: true,
      catalogue: data as VitrixCatalogueRow,
    });
  } catch (err) {
    console.error("PATCH /api/vitrix/site-catalogue/[id] error:", err);
    await logVitrixError(err, "/api/vitrix/site-catalogue/[id]");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/vitrix/site-catalogue/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch current img_path to delete from storage if it's a Supabase URL
    const { data: existing } = await supabase
      .from("catalogue")
      .select("img_path")
      .eq("id", id)
      .single();

    await supabase
      .from("catalogue")
      .update({ parent_id: null, parure_id: null })
      .or(`parent_id.eq.${parseInt(id)},parure_id.eq.${parseInt(id)}`);

    const { error } = await supabase.from("catalogue").delete().eq("id", id);

    if (error) {
      console.error("site-catalogue DELETE error:", error);
      await logVitrixError(error, "/api/vitrix/site-catalogue/[id]");
      return NextResponse.json(
        { error: "Failed to delete catalogue item" },
        { status: 500 },
      );
    }

    // Clean up storage file if uploaded
    if (existing?.img_path?.includes("/storage/v1/object/public/vitrix-media/")) {
      const storagePath = existing.img_path.split(
        "/storage/v1/object/public/vitrix-media/",
      )[1];
      if (storagePath) {
        await supabase.storage.from("vitrix-media").remove([storagePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vitrix/site-catalogue/[id] error:", err);
    await logVitrixError(err, "/api/vitrix/site-catalogue/[id]");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
