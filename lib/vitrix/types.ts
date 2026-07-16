import type { AdminModuleId } from "@/lib/admin-modules";
import type { VitrixLicenseState } from "@/lib/vitrix/license";

export type VitrixSource = "supabase" | "local";

export type VitrixModuleRow = {
  id: AdminModuleId;
  label: string;
  description: string;
  enabled: boolean;
  sort_order: number;
};

export type VitrixCatalogueRow = {
  id: number;
  ref: string;
  title: string;
  description: string | null;
  category: string;
  img_path: string | null;
  img_position: string | null;
  lang: string;
  status: "draft" | "published";
  sort_order: number;
  item_type: "collection" | "item";
  parent_id: number | null;
  /** Legacy compatibility: replaced by parent_id for new catalogue collection code. */
  parure_id: number | null;
  created_at: string;
};

export type VitrixCatalogueCategoryRow = {
  id: string;
  catalogue_key: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
};

export type VitrixPressType = "event" | "fiera" | "press" | "publication";

export type VitrixPressRow = {
  id: number;
  category: string;
  venue: string | null;
  title: string;
  event_date: string | null;
  type: VitrixPressType;
  lang: string;
  status: "draft" | "published";
  description: string | null;
  slug: string | null;
  cover_image: string | null;
  body: string | null;
  excerpt: string | null;
  content: string | null;
  tags: string[] | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_date_label: string | null;
  publication_date: string | null;
  main_image_path: string | null;
  main_image_url: string | null;
  og_image_path: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  image_position: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_target: "_self" | "_blank" | string | null;
  is_featured: boolean;
  sort_order: number;
  widget_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type VitrixMediaFile = {
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
};

export type VitrixRoleRow = {
  id: string;
  name: "superadmin" | "owner" | "admin" | "editor" | "viewer";
  label: string;
};

export type VitrixPermissionRow = {
  id: string;
  key: string;
  label: string;
};

export type VitrixUserRow = {
  id: string;
  email: string;
  roles: string[];
  created_at: string | null;
  last_sign_in_at: string | null;
};

export type VitrixSiteSettings = {
  site_name: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string;
  og_description: string;
  og_image: string | null;
  favicon_path: string | null;
  default_language: "it" | "en";
  updated_at: string | null;
};

export type VitrixLogFile = {
  name: string;
  size: number;
  modified_at: string;
  status: "open" | "resolved";
};

export type GalleryImage = {
  id: string;
  title: string;
  alt_text: string | null;
  category: string | null;
  status: "active" | "draft";
  sort_order: number;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
};

export type MediaCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
  item_count?: number;
};

export type MediaCollectionItem = {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  alt_text: string | null;
  tags: string[];
  category: string | null;
  status: "published" | "draft";
  published_at: string | null;
  slug: string;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/* ── VTX Catalogue widget types ────────────────────────────── */

export type BilingualText = { it: string; en: string };

export type VtxCatalogueConfig = {
  enabled: boolean;
  catalogue_slug: string;
  eyebrow: BilingualText;
  title_pre: BilingualText;
  title_em: BilingualText;
  lede: BilingualText;
  show_filters: boolean;
  visible_categories: string[];
  default_tab: number;
  items_limit: number;
  show_ref_badge: boolean;
  show_cta: boolean;
  cta_label: BilingualText;
};

export const DEFAULT_VTX_CATALOGUE_CONFIG: VtxCatalogueConfig = {
  enabled: true,
  catalogue_slug: "",
  eyebrow: { it: "Il catalogo", en: "Catalogue" },
  title_pre: { it: "Linee uniche,", en: "Unique lines," },
  title_em: { it: "filo avvolto su sagoma.", en: "wire wrapped on mold." },
  lede: {
    it: "Sedici collezioni capsule pensate per esaltare la lavorazione a filo, la trama del metallo e la luce delle pietre.",
    en: "Sixteen capsule collections designed to enhance wire work, the texture of metal and the light of stones.",
  },
  show_filters: false,
  visible_categories: ["Anelli", "Bracciali", "Collane", "Orecchini"],
  default_tab: 0,
  items_limit: 0,
  show_ref_badge: true,
  show_cta: true,
  cta_label: { it: "Tutto il catalogo", en: "All catalogue" },
};

export type CtxCatalogueConfig = VtxCatalogueConfig;
export const DEFAULT_CTX_CATALOGUE_CONFIG = DEFAULT_VTX_CATALOGUE_CONFIG;

/* ── VTX Events widget types ───────────────────────────────── */

/** Riga evento/news arricchita (vedi migration 20260609000000_news_events). */
export type VtxEventRow = {
  id: number;
  translation_group_id: string;
  slug: string | null;
  type: VitrixPressType;
  category: string;
  venue: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  tags: string[];
  event_start_at: string | null;
  event_end_at: string | null;
  event_date_label: string | null;
  publication_date: string | null;
  main_image_path: string | null;
  main_image_url: string | null;
  og_image_path: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  image_position: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_target: string | null;
  is_featured: boolean;
  sort_order: number;
  widget_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  lang: string;
  status: "draft" | "published";
  published_at: string | null;
  /** Campi legacy mantenuti per compatibilità (sorgenti di backfill). */
  event_date: string | null;
  description: string | null;
  cover_image: string | null;
  body: string | null;
  created_at: string;
  updated_at: string | null;
};

export type VtxEventLanguage = "it" | "en";

export type VtxEventTranslationGroup = {
  id: string;
  primary: VtxEventRow;
  it: VtxEventRow | null;
  en: VtxEventRow | null;
  missingLanguages: VtxEventLanguage[];
};

export type VtxEventsConfig = {
  enabled: boolean;
  name?: string;
  section_id: string;
  position?: number;
  eyebrow: BilingualText;
  title: BilingualText;
  description: BilingualText;
  layout: "featured-grid" | "carousel" | "cards";
  items_limit: number;
  sort: "featured_then_date_desc" | "date_desc" | "manual";
  show_filters: boolean;
  featured_first: boolean;
  cta_label: BilingualText;
  publications: {
    enabled: boolean;
    section_id: string;
    title: BilingualText;
    description: BilingualText;
    items_limit: number;
  };
};

export const DEFAULT_VTX_EVENTS_CONFIG: VtxEventsConfig = {
  enabled: true,
  name: "Eventi homepage",
  section_id: "news",
  position: 50,
  eyebrow: { it: "Adv Press · Fiere", en: "Press & Fairs" },
  title: { it: "Eventi", en: "Events" },
  description: {
    it: "R.G.R. presenta le sue collezioni e i nuovi trend di design all’interno dei più prestigiosi palcoscenici del settore orafo internazionale. R.G.R. è presente regolarmente a: VicenzaOro (gennaio e settembre) e OroArezzo (maggio)",
    en: "R.G.R. showcases its collections and the latest design trends at some of the most prestigious events in the international jewelry industry. R.G.R. regularly exhibits at: VicenzaOro (January and September) and OroArezzo (May)",
  },
  layout: "featured-grid",
  items_limit: 6,
  sort: "featured_then_date_desc",
  show_filters: true,
  featured_first: true,
  cta_label: { it: "Leggi", en: "Read" },
  publications: {
    enabled: true,
    section_id: "publications",
    title: { it: "Editorial & Press", en: "Editorial & Press" },
    description: {
      it: "Una selezione di riviste e pubblicazioni che raccontano il mondo R.G.R.",
      en: "A selection of magazines and publications featuring the world of R.G.R.",
    },
    items_limit: 8,
  },
};

export function normalizeVtxEventsConfig(input?: Partial<VtxEventsConfig> | null): VtxEventsConfig {
  const publications = input?.publications;
  return {
    ...DEFAULT_VTX_EVENTS_CONFIG,
    ...input,
    eyebrow: { ...DEFAULT_VTX_EVENTS_CONFIG.eyebrow, ...input?.eyebrow },
    title: { ...DEFAULT_VTX_EVENTS_CONFIG.title, ...input?.title },
    description: { ...DEFAULT_VTX_EVENTS_CONFIG.description, ...input?.description },
    cta_label: { ...DEFAULT_VTX_EVENTS_CONFIG.cta_label, ...input?.cta_label },
    publications: {
      ...DEFAULT_VTX_EVENTS_CONFIG.publications,
      ...publications,
      title: { ...DEFAULT_VTX_EVENTS_CONFIG.publications.title, ...publications?.title },
      description: { ...DEFAULT_VTX_EVENTS_CONFIG.publications.description, ...publications?.description },
    },
  };
}

export type VitrixBootstrap = {
  source: VitrixSource;
  connected: boolean;
  modules: VitrixModuleRow[];
  license: VitrixLicenseState;
  settings: VitrixSiteSettings;
  logsSummary?: {
    open: number;
    resolved: number;
  };
  catalogue: VitrixCatalogueRow[];
  press: VitrixPressRow[];
  roles: VitrixRoleRow[];
  permissions: VitrixPermissionRow[];
  users: VitrixUserRow[];
};
