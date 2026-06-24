import crypto from "crypto";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import type { VtxEventRow, VitrixPressType } from "@/lib/vitrix/types";
import { inputFromFormData, normalizeEventPayload, validateEventPayload } from "@/lib/vitrix/events";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;
type BulkAction = "publish" | "draft" | "feature" | "unfeature" | "delete";

const MEDIA_BUCKET = "vitrix-media";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BULK_ACTIONS = new Set<BulkAction>(["publish", "draft", "feature", "unfeature", "delete"]);

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((id) => Number.parseInt(String(id), 10))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
}

async function uploadEventImage(supabase: SupabaseAdmin, file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Formato immagine non supportato. Usa JPG, PNG, WebP o AVIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Immagine troppo grande. Limite massimo 10MB.");
  }

  const webp = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" })
    .rotate()
    .webp({ quality: 85 })
    .toBuffer();
  const storagePath = `events/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, webp, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return { path: storagePath, url: data.publicUrl };
}

async function eventInputFromRequest(req: NextRequest, supabase: SupabaseAdmin) {
  const isMultipart = req.headers.get("content-type")?.includes("multipart/form-data");
  if (!isMultipart) return await req.json();

  const formData = await req.formData();
  const input = inputFromFormData(formData);
  const file = formData.get("main_image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadEventImage(supabase, file);
    input.main_image_path = uploaded.path;
    input.main_image_url = uploaded.url;
    input.cover_image = uploaded.url;
  }
  const ogFile = formData.get("og_image");
  if (ogFile instanceof File && ogFile.size > 0) {
    const uploaded = await uploadEventImage(supabase, ogFile);
    input.og_image_path = uploaded.path;
    input.og_image_url = uploaded.url;
  }
  return input;
}

function eventsQueryFromSearchParams(req: NextRequest, supabase: SupabaseAdmin) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const lang = url.searchParams.get("lang");
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured");
  const q = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("news")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("event_start_at", { ascending: false, nullsFirst: false })
    .order("event_date", { ascending: false });

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (lang) query = query.eq("lang", lang);
  if (category) query = query.eq("category", category);
  if (featured === "true") query = query.eq("is_featured", true);
  if (featured === "false") query = query.eq("is_featured", false);
  if (q) {
    const safeQ = q.replace(/[%_,]/g, "\\$&");
    query = query.or(`title.ilike.%${safeQ}%,slug.ilike.%${safeQ}%,category.ilike.%${safeQ}%,venue.ilike.%${safeQ}%`);
  }

  return query;
}

export async function getVitrixEvents(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;
    if (auth.local) return NextResponse.json({ items: [] });

    const { data, error } = await eventsQueryFromSearchParams(req, createAdminClient());
    if (error) {
      await logVitrixError(error, "/api/vitrix/events");
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    return NextResponse.json({ items: (data ?? []) as VtxEventRow[] });
  } catch (err) {
    console.error("GET /api/vitrix/events error:", err);
    await logVitrixError(err, "/api/vitrix/events");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function createVitrixEvent(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.press.write");
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();
    const payload = normalizeEventPayload(await eventInputFromRequest(req, supabase));
    const validationError = validateEventPayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { data, error } = await supabase.from("news").insert(payload).select().single();
    if (error) {
      await logVitrixError(error, "/api/vitrix/events");
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data as VtxEventRow }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vitrix/events error:", err);
    await logVitrixError(err, "/api/vitrix/events");
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function getVitrixEventById(_req: NextRequest, id: string) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    const { data, error } = await createAdminClient().from("news").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });

    return NextResponse.json({ item: data as VtxEventRow });
  } catch (err) {
    console.error("GET /api/vitrix/events/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function updateVitrixEvent(req: NextRequest, id: string) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.press.write");
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();
    const { data: current, error: currentError } = await supabase.from("news").select("*").eq("id", id).single();
    if (currentError || !current) return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });

    const input = await eventInputFromRequest(req, supabase);
    const payload = normalizeEventPayload({ ...current, ...input }, current.slug);
    const validationError = validateEventPayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { data, error } = await supabase.from("news").update(payload).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "Failed to update event" }, { status: 500 });

    return NextResponse.json({ success: true, item: data as VtxEventRow });
  } catch (err) {
    console.error("PATCH /api/vitrix/events/[id] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function deleteVitrixEvent(_req: NextRequest, id: string) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.press.write");
    if ("response" in auth) return auth.response;

    const { error } = await createAdminClient().from("news").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vitrix/events/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function bulkUpdateVitrixEvents(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.press.write");
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const ids = normalizeIds(body?.ids);
    const action = body?.action as BulkAction | undefined;

    if (ids.length === 0) return NextResponse.json({ error: "Seleziona almeno un evento." }, { status: 400 });
    if (!action || !BULK_ACTIONS.has(action)) return NextResponse.json({ error: "Azione massiva non valida." }, { status: 400 });

    const supabase = createAdminClient();
    if (action === "delete") {
      const { error } = await supabase.from("news").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ success: true, updated: ids.length });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (action === "publish") {
      updates.status = "published";
      updates.published_at = new Date().toISOString();
    }
    if (action === "draft") updates.status = "draft";
    if (action === "feature") updates.is_featured = true;
    if (action === "unfeature") updates.is_featured = false;

    const { error } = await supabase.from("news").update(updates).in("id", ids);
    if (error) throw error;

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error("PATCH /api/vitrix/events/bulk error:", err);
    await logVitrixError(err, "/api/vitrix/events/bulk");
    return NextResponse.json({ error: "Errore durante l'azione massiva." }, { status: 500 });
  }
}

export async function getPublicEvents(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") as VitrixPressType | null;
    const lang = searchParams.get("lang");
    const widgetId = searchParams.get("widget_id");
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100);
    const page = Math.max(Number.parseInt(searchParams.get("page") || "0", 10), 0);

    let query = supabase.from("news").select("*", { count: "exact" }).eq("status", "published");
    if (type) query = query.eq("type", type);
    if (lang) query = query.eq("lang", lang);
    if (widgetId) query = query.eq("widget_id", widgetId);

    const { data, error, count } = await query
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("event_start_at", { ascending: false, nullsFirst: false })
      .order("event_date", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("relation")) {
        return NextResponse.json({ items: [], count: 0, page, limit, total_pages: 0 });
      }
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    return NextResponse.json({
      items: (data ?? []) as VtxEventRow[],
      count: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
