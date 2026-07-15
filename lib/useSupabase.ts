import { useEffect, useState } from "react";
import { hasSupabaseBrowserConfig, supabaseBrowser, getCurrentUser, signOut as supabaseSignOut } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type CatalogueRow = {
  id: number;
  ref: string;
  title: string;
  description: string | null;
  category: string;
  img_path: string | null;
  img_position: string | null;
  lang: string;
  status: string;
  sort_order: number;
  item_type?: "collection" | "item" | null;
  parent_id?: number | null;
  /** Legacy compatibility: replaced by parent_id for collection children. */
  parure_id?: number | null;
};

export type CollectionRow = CatalogueRow;

const CATALOGUE_LANGS = ["it", "en"] as const;
const PARURE_CATEGORY = "Parure";

function isCatalogueCollection(row: CatalogueRow): boolean {
  if (row.item_type === "collection" || row.item_type === "item") {
    return row.item_type === "collection";
  }
  return row.category === PARURE_CATEGORY;
}

function getCatalogueParentId(row: CatalogueRow): number | null {
  return row.parent_id ?? row.parure_id ?? null;
}

function filterEmptyCatalogueCollections(items: CatalogueRow[]): CatalogueRow[] {
  const collectionIdsWithChildren = new Set(
    items
      .map((row) => getCatalogueParentId(row))
      .filter((parentId): parentId is number => parentId != null),
  );

  return items.filter((row) => !isCatalogueCollection(row) || collectionIdsWithChildren.has(row.id));
}

function fillCatalogueImageFromSibling(items: CatalogueRow[], lang: string) {
  const byRef = new Map<string, CatalogueRow[]>();

  items.forEach((row) => {
    const list = byRef.get(row.ref) ?? [];
    list.push(row);
    byRef.set(row.ref, list);
  });

  return items
    .filter((row) => row.lang === lang)
    .map((row) => {
      if (row.img_path?.trim()) return row;

      const sibling = byRef.get(row.ref)?.find((item) => item.id !== row.id && item.img_path?.trim());
      if (!sibling) return row;

      return {
        ...row,
        img_path: sibling.img_path,
        img_position: row.img_position ?? sibling.img_position,
      };
    });
}

export type NewsRow = {
  id: number;
  category: string;
  venue: string | null;
  title: string;
  event_date: string | null;
  type: "event" | "fiera" | "press" | "publication";
  lang: string;
  status: string;
  slug?: string | null;
  cover_image?: string | null;
  body?: string | null;
  description?: string | null;
  excerpt?: string | null;
  content?: string | null;
  tags?: string[] | null;
  event_start_at?: string | null;
  event_end_at?: string | null;
  event_date_label?: string | null;
  main_image_path?: string | null;
  main_image_url?: string | null;
  og_image_path?: string | null;
  og_image_url?: string | null;
  image_alt?: string | null;
  image_position?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  cta_target?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  widget_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
  published_at?: string | null;
};

export function useCatalogue(lang: string = "it") {
  const [items, setItems] = useState<CatalogueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig || !supabaseBrowser) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabaseBrowser
      .from("catalogue")
      .select("*")
      .in("lang", CATALOGUE_LANGS as unknown as string[])
      .eq("status", "published")
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (err || !data || data.length === 0) {
          setItems([]);
          if (err) setError(err.message);
        } else {
          const normalizedItems = fillCatalogueImageFromSibling(data as CatalogueRow[], lang);
          setItems(filterEmptyCatalogueCollections(normalizedItems));
        }
        setLoading(false);
      });
  }, [lang]);

  return { items, loading, error };
}

export function useCollections(lang: string = "it") {
  const { items, loading, error } = useCatalogue(lang);
  return { collections: items, loading, error };
}

export function useNews(lang: string = "it") {
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events?lang=${encodeURIComponent(lang)}&widget_id=vtx_events&limit=50`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Errore caricamento eventi.");
        return json.items as NewsRow[] | undefined;
      })
      .then((data) => {
        setNews(data || []);
        setError(null);
      })
      .catch((err: Error) => {
        setNews([]);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lang]);

  return { news, loading, error };
}

/**
 * Categorie eventi (lettura pubblica) per i tab dinamici del widget VTX Events.
 * Ritorna i nomi ordinati per sort_order. Se Supabase non è configurato o la
 * tabella è vuota, ritorna lista vuota (il widget userà solo il tab "Tutte").
 */
export function useEventCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig || !supabaseBrowser) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabaseBrowser
      .from("event_categories")
      .select("name,sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setCategories(((data ?? []) as { name: string }[]).map((row) => row.name).filter(Boolean));
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    }
  };

  return { user, loading, error, signOut };
}
