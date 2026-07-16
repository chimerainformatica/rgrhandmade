import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import type { VitrixCatalogueRow } from "@/lib/vitrix/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.catalogue.write");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const targetLang = body?.lang === "en" ? "en" : body?.lang === "it" ? "it" : null;
    if (!targetLang) return NextResponse.json({ error: "Lingua non valida" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: source, error: sourceError } = await supabase.from("catalogue").select("*").eq("id", id).single();
    if (sourceError || !source) return NextResponse.json({ error: "Elemento sorgente non trovato" }, { status: 404 });
    if (source.lang === targetLang) return NextResponse.json({ error: "La variante richiesta esiste gia" }, { status: 409 });

    const { data: existing } = await supabase
      .from("catalogue")
      .select("id")
      .eq("translation_group_id", source.translation_group_id)
      .eq("lang", targetLang)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "La variante richiesta esiste gia" }, { status: 409 });

    let parentId: number | null = null;
    if (source.parent_translation_group_id) {
      const { data: parent } = await supabase
        .from("catalogue")
        .select("id")
        .eq("translation_group_id", source.parent_translation_group_id)
        .eq("lang", targetLang)
        .maybeSingle();
      parentId = parent?.id ?? null;
    }

    const { id: _sourceId, created_at: _createdAt, ...copy } = source;
    void _sourceId;
    void _createdAt;
    const { data, error } = await supabase
      .from("catalogue")
      .insert({
        ...copy,
        lang: targetLang,
        status: "draft",
        parent_id: parentId,
        parure_id: parentId,
      })
      .select()
      .single();
    if (error) {
      await logVitrixError(error, "/api/vitrix/site-catalogue/[id]/translations");
      return NextResponse.json({ error: "Impossibile creare la traduzione" }, { status: error.code === "23505" ? 409 : 500 });
    }

    return NextResponse.json({ success: true, catalogue: data as VitrixCatalogueRow }, { status: 201 });
  } catch (error) {
    await logVitrixError(error, "/api/vitrix/site-catalogue/[id]/translations");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
