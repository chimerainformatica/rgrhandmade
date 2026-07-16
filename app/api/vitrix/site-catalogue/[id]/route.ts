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
      .select("id,translation_group_id,ref,lang,img_path,img_position,category,item_type,parent_id,parure_id")
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
      if (parentId) {
        const { data: parent } = await supabase
          .from("catalogue")
          .select("translation_group_id")
          .eq("id", parentId)
          .maybeSingle();
        update.parent_translation_group_id = parent?.translation_group_id ?? null;
      } else {
        update.parent_translation_group_id = null;
      }
    }
    if (sortOrderRaw !== null) update.sort_order = parseInt(sortOrderRaw);

    const currentRef = (ref ?? existing?.ref) ?? null;
    const currentLang = (lang ?? existing?.lang) ?? null;

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

    const finalCategory = (category !== null ? update.category : existing?.category) ?? null;
    const finalItemType = (update.item_type as string | undefined) ?? existing?.item_type ?? (finalCategory === "Parure" ? "collection" : "item");
    if (finalItemType === "collection") {
      await supabase
        .from("catalogue")
        .update({ parent_id: null, parure_id: null, parent_translation_group_id: null })
        .eq("parent_translation_group_id", existing?.translation_group_id);

      if (collectionItems.length > 0) {
        const { data: selectedItems } = await supabase
          .from("catalogue")
          .select("translation_group_id")
          .in("id", collectionItems);
        const childGroups = Array.from(new Set((selectedItems ?? []).map((item) => item.translation_group_id)));
        const { data: parentVariants } = await supabase
          .from("catalogue")
          .select("id,lang")
          .eq("translation_group_id", existing?.translation_group_id);
        await Promise.all((parentVariants ?? []).flatMap((parent) => childGroups.map((groupId) =>
          supabase
            .from("catalogue")
            .update({
              parent_id: parent.id,
              parure_id: parent.id,
              parent_translation_group_id: existing?.translation_group_id,
              item_type: "item",
            })
            .eq("translation_group_id", groupId)
            .eq("lang", parent.lang)
        )));
      }
    } else if (existing?.item_type === "collection" || existing?.category === "Parure") {
      await supabase
        .from("catalogue")
        .update({ parent_id: null, parure_id: null, parent_translation_group_id: null })
        .eq("parent_translation_group_id", existing.translation_group_id);
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
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch current img_path to delete from storage if it's a Supabase URL
    const { data: existing } = await supabase
      .from("catalogue")
      .select("img_path,translation_group_id")
      .eq("id", id)
      .single();

    const deleteGroup = req.nextUrl.searchParams.get("scope") === "group";
    const { data: targets } = deleteGroup && existing?.translation_group_id
      ? await supabase.from("catalogue").select("id").eq("translation_group_id", existing.translation_group_id)
      : { data: [{ id: Number(id) }] };
    const targetIds = (targets ?? []).map((row) => row.id);

    await supabase
      .from("catalogue")
      .update({ parent_id: null, parure_id: null, parent_translation_group_id: null })
      .in("parent_id", targetIds);

    const { error } = await supabase.from("catalogue").delete().in("id", targetIds);

    if (error) {
      console.error("site-catalogue DELETE error:", error);
      await logVitrixError(error, "/api/vitrix/site-catalogue/[id]");
      return NextResponse.json(
        { error: "Failed to delete catalogue item" },
        { status: 500 },
      );
    }

    // Clean up storage file if uploaded
    const { count: remainingImageUsers } = existing?.img_path
      ? await supabase.from("catalogue").select("id", { count: "exact", head: true }).eq("img_path", existing.img_path)
      : { count: 0 };
    if ((remainingImageUsers ?? 0) === 0 && existing?.img_path?.includes("/storage/v1/object/public/vitrix-media/")) {
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
