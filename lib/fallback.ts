import type { CatalogueRow, NewsRow } from "./useSupabase";

export const FALLBACK_CATALOGUE_IT: CatalogueRow[] = [
  { id: 1, ref: "Nº 016", title: "Filigrana",  description: "Oro 18kt · pietre dure",     category: "Collane",   img_path: "hero-1.png", img_position: "70% 80%", lang: "it", status: "published", sort_order: 1 },
  { id: 2, ref: "Nº 014", title: "Trame",       description: "Argento 925 · brunito",       category: "Bracciali", img_path: "hero-2.png", img_position: "78% 50%", lang: "it", status: "published", sort_order: 2 },
  { id: 3, ref: "Nº 011", title: "Sfere",       description: "Oro champagne · perle",       category: "Collane",   img_path: "hero-3.png", img_position: "72% 35%", lang: "it", status: "published", sort_order: 3 },
  { id: 4, ref: "Nº 008", title: "Onda",        description: "Oro 18kt · diamanti",         category: "Anelli",    img_path: "hero-4.png", img_position: "72% 45%", lang: "it", status: "published", sort_order: 4 },
  { id: 5, ref: "Nº 005", title: "Foglia",      description: "Argento · finitura satinata", category: "Orecchini", img_path: "hero-1.png", img_position: "44% 60%", lang: "it", status: "published", sort_order: 5 },
  { id: 6, ref: "Nº 002", title: "Notte",       description: "Oro brunito · zaffiri",       category: "Anelli",    img_path: "hero-2.png", img_position: "55% 60%", lang: "it", status: "published", sort_order: 6 },
];

export const FALLBACK_CATALOGUE_EN: CatalogueRow[] = [
  { id: 1, ref: "Nº 016", title: "Filigree",    description: "18kt gold · hard stones",     category: "Collane",   img_path: "hero-1.png", img_position: "70% 80%", lang: "en", status: "published", sort_order: 1 },
  { id: 2, ref: "Nº 014", title: "Weaves",      description: "Sterling silver · burnished", category: "Bracciali", img_path: "hero-2.png", img_position: "78% 50%", lang: "en", status: "published", sort_order: 2 },
  { id: 3, ref: "Nº 011", title: "Spheres",     description: "Champagne gold · pearls",     category: "Collane",   img_path: "hero-3.png", img_position: "72% 35%", lang: "en", status: "published", sort_order: 3 },
  { id: 4, ref: "Nº 008", title: "Wave",        description: "18kt gold · diamonds",        category: "Anelli",    img_path: "hero-4.png", img_position: "72% 45%", lang: "en", status: "published", sort_order: 4 },
  { id: 5, ref: "Nº 005", title: "Leaf",        description: "Silver · satin finish",       category: "Orecchini", img_path: "hero-1.png", img_position: "44% 60%", lang: "en", status: "published", sort_order: 5 },
  { id: 6, ref: "Nº 002", title: "Notte",       description: "Burnished gold · sapphires",  category: "Anelli",    img_path: "hero-2.png", img_position: "55% 60%", lang: "en", status: "published", sort_order: 6 },
];

export const FALLBACK_NEWS_IT: NewsRow[] = [
  { id: 1, category: "Fiera", venue: "Vicenza",           title: "VicenzaOro January 2020",  event_date: "16 — 22 Gennaio 2020",  type: "fiera", lang: "it", status: "published" },
  { id: 2, category: "Press", venue: "",                  title: "Gold/Italy October 2019",  event_date: "5 — 8 Ottobre 2019",   type: "press", lang: "it", status: "published" },
  { id: 3, category: "Press", venue: "",                  title: "Shine and Passion",        event_date: "Numero speciale",       type: "press", lang: "it", status: "published" },
  { id: 4, category: "Fiera", venue: "Istanbul",          title: "Istanbul Jewelry Show",    event_date: "Marzo 2016",            type: "fiera", lang: "it", status: "published" },
  { id: 5, category: "Press", venue: "",                  title: "18 Karati Black",          event_date: "Edizione monografica",  type: "press", lang: "it", status: "published" },
  { id: 6, category: "Fiera", venue: "Arezzo",            title: "Oroarezzo 2019",           event_date: "11 — 14 Maggio 2019",  type: "fiera", lang: "it", status: "published" },
  { id: 7, category: "Press", venue: "",                  title: "Oro Arezzo Magazine",      event_date: "Primavera 2018",        type: "press", lang: "it", status: "published" },
];

export const FALLBACK_NEWS_EN: NewsRow[] = [
  { id: 1, category: "Fair",  venue: "Vicenza",           title: "VicenzaOro January 2020",  event_date: "Jan 16 — 22, 2020",    type: "fiera", lang: "en", status: "published" },
  { id: 2, category: "Press", venue: "",                  title: "Gold/Italy October 2019",  event_date: "Oct 5 — 8, 2019",     type: "press", lang: "en", status: "published" },
  { id: 3, category: "Press", venue: "",                  title: "Shine and Passion",        event_date: "Special edition",       type: "press", lang: "en", status: "published" },
  { id: 4, category: "Fair",  venue: "Istanbul",          title: "Istanbul Jewelry Show",    event_date: "March 2016",            type: "fiera", lang: "en", status: "published" },
  { id: 5, category: "Press", venue: "",                  title: "18 Karati Black",          event_date: "Monographic issue",     type: "press", lang: "en", status: "published" },
  { id: 6, category: "Fair",  venue: "Arezzo",            title: "Oroarezzo 2019",           event_date: "May 11 — 14, 2019",   type: "fiera", lang: "en", status: "published" },
  { id: 7, category: "Press", venue: "",                  title: "Oro Arezzo Magazine",      event_date: "Spring 2018",           type: "press", lang: "en", status: "published" },
];

export function getFallbackCatalogue(lang: string): CatalogueRow[] {
  return lang === "en" ? FALLBACK_CATALOGUE_EN : FALLBACK_CATALOGUE_IT;
}

export function getFallbackNews(lang: string): NewsRow[] {
  return lang === "en" ? FALLBACK_NEWS_EN : FALLBACK_NEWS_IT;
}
