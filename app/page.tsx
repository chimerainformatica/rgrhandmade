import { HomePage } from "@/components/HomePage";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { site } from "@/lib/content";
import { getSiteSettings } from "@/lib/vitrix/settings";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_VTX_CATALOGUE_CONFIG, DEFAULT_VTX_EVENTS_CONFIG, type MediaCollection, type MediaCollectionItem, type VtxCatalogueConfig, type VtxEventsConfig } from "@/lib/vitrix/types";

const landingTitle = "Gioielli artigianali Made in Italy";
const landingDescription =
  "R.G.R. Handmade realizza gioielli artigianali Made in Italy ad Arezzo dal 1989: collezioni, lavorazioni orafe e creazioni su misura.";

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  openGraph: {
    title: `${landingTitle} - R.G.R. Handmade`,
    description: landingDescription,
  },
  twitter: {
    title: `${landingTitle} - R.G.R. Handmade`,
    description: landingDescription,
  },
};

async function getCatalogueData(slug: string): Promise<{ collection: MediaCollection; items: MediaCollectionItem[] } | null> {
  const config = getSupabaseConfig();
  if (!config.hasServiceRole || !slug) return null;

  const supabase = createAdminClient();
  const { data: collection, error } = await supabase
    .from("media_collections")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !collection) return null;

  const { data: items } = await supabase
    .from("media_collection_items")
    .select("*")
    .eq("collection_id", collection.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  return { collection: collection as MediaCollection, items: (items ?? []) as MediaCollectionItem[] };
}

async function getVtxCatalogueConfig(): Promise<VtxCatalogueConfig> {
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return DEFAULT_VTX_CATALOGUE_CONFIG;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("vitrix_widget_settings")
      .select("widget_id, config")
      .in("widget_id", ["vtx_catalogue", "ctx_catalogue"]);
    if (error || !data) return DEFAULT_VTX_CATALOGUE_CONFIG;

    const vtx = data.find((row) => row.widget_id === "vtx_catalogue");
    const legacy = data.find((row) => row.widget_id === "ctx_catalogue");
    return ((vtx ?? legacy)?.config as VtxCatalogueConfig | undefined) ?? DEFAULT_VTX_CATALOGUE_CONFIG;
  } catch {
    return DEFAULT_VTX_CATALOGUE_CONFIG;
  }
}

async function getVtxEventsConfig(): Promise<VtxEventsConfig> {
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return DEFAULT_VTX_EVENTS_CONFIG;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("vitrix_widget_settings")
      .select("config")
      .eq("widget_id", "vtx_events")
      .maybeSingle();
    if (error || !data?.config) return DEFAULT_VTX_EVENTS_CONFIG;
    return { ...DEFAULT_VTX_EVENTS_CONFIG, ...(data.config as Partial<VtxEventsConfig>) };
  } catch {
    return DEFAULT_VTX_EVENTS_CONFIG;
  }
}

export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const [settings, catalogueConfig, eventsConfig] = await Promise.all([
    getSiteSettings(),
    getVtxCatalogueConfig(),
    getVtxEventsConfig(),
  ]);
  const selectedCatalogue = await getCatalogueData(catalogueConfig.catalogue_slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone,
    vatID: site.vat,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressCountry: site.address.country
    }
  };

  return (
    <>
      <script
        nonce={nonce}
        suppressHydrationWarning
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage
        initialLang={settings.default_language}
        catalogueConfig={catalogueConfig}
        eventsConfig={eventsConfig}
        catalogueData={selectedCatalogue}
      />
    </>
  );
}
