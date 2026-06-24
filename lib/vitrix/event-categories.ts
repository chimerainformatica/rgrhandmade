/**
 * Categorie eventi (VTX Events) — stile WordPress: categorie create dall'utente
 * a cui gli articoli (righe `news`) si attribuiscono PER NOME (campo news.category).
 * Rispecchia il pattern di lib/vitrix/catalogue-categories.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type EventCategoryRow = {
  id: string;
  events_key: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
};

const EVENTS_KEY = "events";
const SELECT_COLS = "id,events_key,name,sort_order,created_at,updated_at";
type SupabaseLike = SupabaseClient;

export function normalizeEventCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sameCategory(a: string, b: string) {
  return normalizeEventCategoryName(a).toLowerCase() === normalizeEventCategoryName(b).toLowerCase();
}

export async function listEventCategories(supabase: SupabaseLike): Promise<EventCategoryRow[]> {
  const { data, error } = await supabase
    .from("event_categories")
    .select(SELECT_COLS)
    .eq("events_key", EVENTS_KEY)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  const { data: items } = await supabase.from("news").select("category");
  const counts = new Map<string, number>();
  (items ?? []).forEach((row: { category?: string | null }) => {
    const key = normalizeEventCategoryName(String(row.category ?? ""));
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return ((data ?? []) as EventCategoryRow[]).map((row) => ({
    ...row,
    item_count: counts.get(normalizeEventCategoryName(row.name)) ?? 0,
  }));
}

export async function ensureEventCategory(supabase: SupabaseLike, name: string) {
  const normalizedName = normalizeEventCategoryName(name);
  if (!normalizedName) throw new Error("Il nome della categoria non può essere vuoto.");

  const existing = await listEventCategories(supabase);
  const match = existing.find((row) => sameCategory(row.name, normalizedName));
  if (match) return match;

  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((row) => row.sort_order)) + 1 : 0;
  const { data, error } = await supabase
    .from("event_categories")
    .insert({ events_key: EVENTS_KEY, name: normalizedName, sort_order: nextSortOrder })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return { ...(data as EventCategoryRow), item_count: 0 };
}

export async function renameEventCategory(supabase: SupabaseLike, id: string, nextName: string) {
  const normalizedName = normalizeEventCategoryName(nextName);
  if (!normalizedName) throw new Error("Il nome della categoria non può essere vuoto.");

  const { data: current, error: currentError } = await supabase
    .from("event_categories")
    .select(SELECT_COLS)
    .eq("events_key", EVENTS_KEY)
    .eq("id", id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new Error("Categoria non trovata.");

  if (sameCategory(current.name, normalizedName)) return current as EventCategoryRow;

  const existing = await listEventCategories(supabase);
  const duplicate = existing.find((row) => row.id !== id && sameCategory(row.name, normalizedName));
  if (duplicate) throw new Error("Esiste già una categoria con questo nome.");

  const { data, error } = await supabase
    .from("event_categories")
    .update({ name: normalizedName, updated_at: new Date().toISOString() })
    .eq("events_key", EVENTS_KEY)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();

  if (error) throw error;

  // Riallinea gli articoli attribuiti alla vecchia categoria.
  await supabase.from("news").update({ category: normalizedName }).eq("category", current.name);

  return data as EventCategoryRow;
}

export async function deleteEventCategory(supabase: SupabaseLike, id: string) {
  const { data: current, error } = await supabase
    .from("event_categories")
    .select(SELECT_COLS)
    .eq("events_key", EVENTS_KEY)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!current) throw new Error("Categoria non trovata.");

  const { count, error: countError } = await supabase
    .from("news")
    .select("id", { count: "exact", head: true })
    .eq("category", current.name);

  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    const err = new Error("La categoria è usata in almeno un articolo.");
    (err as Error & { status?: number }).status = 409;
    throw err;
  }

  const { error: deleteError } = await supabase
    .from("event_categories")
    .delete()
    .eq("events_key", EVENTS_KEY)
    .eq("id", id);

  if (deleteError) throw deleteError;
}

export async function reorderEventCategories(
  supabase: SupabaseLike,
  items: Array<{ id: string; sort_order: number }>,
) {
  const { data: current, error } = await supabase
    .from("event_categories")
    .select(SELECT_COLS)
    .eq("events_key", EVENTS_KEY)
    .in("id", items.map((item) => item.id));

  if (error) throw error;

  const validIds = new Set((current ?? []).map((row: EventCategoryRow) => row.id));
  const safeItems = items.filter((item) => validIds.has(item.id));
  if (safeItems.length === 0) throw new Error("Categorie non valide.");

  const results = await Promise.all(
    safeItems.map(({ id, sort_order }) =>
      supabase
        .from("event_categories")
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq("events_key", EVENTS_KEY)
        .eq("id", id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
