import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSiteSettings } from "@/lib/vitrix/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const entries: MetadataRoute.Sitemap = [
    {
      url: settings.canonical_url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1
    }
  ];

  if (!getSupabaseConfig().hasServiceRole) return entries;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("news")
      .select("type, slug, updated_at, published_at")
      .eq("status", "published")
      .not("slug", "is", null);

    if (error || !data) return entries;

    for (const item of data) {
      if (!item.type || !item.slug) continue;
      entries.push({
        url: new URL(`/events/${item.type}/${item.slug}`, settings.canonical_url).toString(),
        lastModified: item.updated_at ?? item.published_at ?? new Date(),
        changeFrequency: "monthly",
        priority: item.type === "event" || item.type === "fiera" ? 0.7 : 0.6
      });
    }
  } catch {
    return entries;
  }

  return entries;
}
