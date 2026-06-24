import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/vitrix/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();

  return {
    rules: {
      userAgent: "*",
      allow: settings.robots_index ? "/" : undefined,
      disallow: settings.robots_index ? "/admin" : "/"
    },
    sitemap: `${settings.canonical_url.replace(/\/$/, "")}/sitemap.xml`
  };
}
