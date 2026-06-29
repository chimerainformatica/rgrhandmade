import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/vitrix/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const siteUrl = settings.canonical_url.replace(/\/$/, "");

  if (process.env.VITRIX_MAINTENANCE === "true") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      },
      sitemap: `${siteUrl}/sitemap.xml`
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: settings.robots_index ? "/" : undefined,
      disallow: settings.robots_index ? "/admin" : "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
