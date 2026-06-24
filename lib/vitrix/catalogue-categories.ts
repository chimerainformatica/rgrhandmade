export type CatalogueCategoryRow = {
  id: string;
  catalogue_key: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
};

import type { SupabaseClient } from "@supabase/supabase-js";

const CATALOGUE_KEY = "catalogue";
type SupabaseLike = SupabaseClient;

export function normalizeCatalogueCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sameCategory(a: string, b: string) {
  return normalizeCatalogueCategoryName(a).toLowerCase() === normalizeCatalogueCategoryName(b).toLowerCase();
}

export async function listCatalogueCategories(
  supabase: SupabaseLike,
): Promise<CatalogueCategoryRow[]> {
  const { data, error } = await supabase
    .from("catalogue_categories")
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .eq("catalogue_key", CATALOGUE_KEY)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  const { data: items } = await supabase.from("catalogue").select("category");
  const counts = new Map<string, number>();
  (items ?? []).forEach((row: { category?: string | null }) => {
    const key = normalizeCatalogueCategoryName(String(row.category ?? ""));
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return ((data ?? []) as CatalogueCategoryRow[]).map((row: CatalogueCategoryRow) => ({
    ...row,
    item_count: counts.get(normalizeCatalogueCategoryName(row.name)) ?? 0,
  }));
}

export async function ensureCatalogueCategory(
  supabase: SupabaseLike,
  name: string,
) {
  const normalizedName = normalizeCatalogueCategoryName(name);
  if (!normalizedName) {
    throw new Error("Il nome della categoria non puo essere vuoto.");
  }

  const existing = await listCatalogueCategories(supabase);
  const match = existing.find((row) => sameCategory(row.name, normalizedName));
  if (match) return match;

  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((row: CatalogueCategoryRow) => row.sort_order)) + 1 : 0;
  const { data, error } = await supabase
    .from("catalogue_categories")
    .insert({
      catalogue_key: CATALOGUE_KEY,
      name: normalizedName,
      sort_order: nextSortOrder,
    })
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .single();

  if (error) throw error;
  return {
    ...(data as CatalogueCategoryRow),
    item_count: 0,
  };
}

export async function renameCatalogueCategory(
  supabase: SupabaseLike,
  id: string,
  nextName: string,
) {
  const normalizedName = normalizeCatalogueCategoryName(nextName);
  if (!normalizedName) throw new Error("Il nome della categoria non puo essere vuoto.");

  const { data: current, error: currentError } = await supabase
    .from("catalogue_categories")
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .eq("catalogue_key", CATALOGUE_KEY)
    .eq("id", id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new Error("Categoria non trovata.");

  if (sameCategory(current.name, normalizedName)) return current as CatalogueCategoryRow;

  const existing = await listCatalogueCategories(supabase);
  const duplicate = existing.find((row) => row.id !== id && sameCategory(row.name, normalizedName));
  if (duplicate) {
    throw new Error("Esiste già una categoria con questo nome.");
  }

  const { data, error } = await supabase
    .from("catalogue_categories")
    .update({
      name: normalizedName,
      updated_at: new Date().toISOString(),
    })
    .eq("catalogue_key", CATALOGUE_KEY)
    .eq("id", id)
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .single();

  if (error) throw error;

  await supabase
    .from("catalogue")
    .update({ category: normalizedName })
    .eq("category", current.name);

  return data as CatalogueCategoryRow;
}

export async function deleteCatalogueCategory(
  supabase: SupabaseLike,
  id: string,
) {
  const { data: current, error } = await supabase
    .from("catalogue_categories")
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .eq("catalogue_key", CATALOGUE_KEY)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!current) throw new Error("Categoria non trovata.");

  const { count, error: countError } = await supabase
    .from("catalogue")
    .select("id", { count: "exact", head: true })
    .eq("category", current.name);

  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    const err = new Error("La categoria è usata in almeno una collezione.");
    (err as Error & { status?: number }).status = 409;
    throw err;
  }

  const { error: deleteError } = await supabase
    .from("catalogue_categories")
    .delete()
    .eq("catalogue_key", CATALOGUE_KEY)
    .eq("id", id);

  if (deleteError) throw deleteError;
}

export async function reorderCatalogueCategories(
  supabase: SupabaseLike,
  items: Array<{ id: string; sort_order: number }>,
) {
  const { data: current, error } = await supabase
    .from("catalogue_categories")
    .select("id,catalogue_key,name,sort_order,created_at,updated_at")
    .eq("catalogue_key", CATALOGUE_KEY)
    .in("id", items.map((item) => item.id));

  if (error) throw error;

  const validIds = new Set((current ?? []).map((row: CatalogueCategoryRow) => row.id));
  const safeItems = items.filter((item) => validIds.has(item.id));
  if (safeItems.length === 0) {
    throw new Error("Categorie non valide.");
  }

  const results = await Promise.all(
    safeItems.map(({ id, sort_order }) =>
      supabase
        .from("catalogue_categories")
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq("catalogue_key", CATALOGUE_KEY)
        .eq("id", id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
