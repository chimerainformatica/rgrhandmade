import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { getSiteSettings } from "@/lib/vitrix/settings";
import { initVitrixErrorLogger } from "@/lib/vitrix/logs";
import "./globals.css";

initVitrixErrorLogger();

export const dynamic = "force-dynamic";

const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond/cormorant-garamond-300-latin.woff2", weight: "300", style: "normal" },
    { path: "./fonts/cormorant-garamond/cormorant-garamond-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant-garamond/cormorant-garamond-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-garamond/cormorant-garamond-300-italic-latin.woff2", weight: "300", style: "italic" },
    { path: "./fonts/cormorant-garamond/cormorant-garamond-400-italic-latin.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant-garamond/cormorant-garamond-500-italic-latin.woff2", weight: "500", style: "italic" }
  ],
  variable: "--font-cormorant",
  display: "swap"
});

const manrope = localFont({
  src: [
    { path: "./fonts/manrope/manrope-300-latin.woff2", weight: "300", style: "normal" },
    { path: "./fonts/manrope/manrope-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/manrope/manrope-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/manrope/manrope-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/manrope/manrope-700-latin.woff2", weight: "700", style: "normal" }
  ],
  variable: "--font-manrope",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const canonical = new URL(settings.canonical_url);
  const isMaintenance = process.env.VITRIX_MAINTENANCE === "true";

  return {
    title: { default: settings.seo_title, template: `%s - ${settings.site_name}` },
    description: settings.seo_description,
    metadataBase: canonical,
    alternates: { canonical: "/" },
    robots: { index: isMaintenance ? false : settings.robots_index, follow: isMaintenance ? false : settings.robots_follow },
    icons: settings.favicon_path ? { icon: settings.favicon_path, shortcut: settings.favicon_path } : undefined,
    openGraph: {
      type: "website",
      siteName: settings.site_name,
      locale: settings.default_language === "en" ? "en_US" : "it_IT",
      url: settings.canonical_url,
      title: settings.og_title,
      description: settings.og_description,
      images: settings.og_image ? [settings.og_image] : undefined
    },
    twitter: {
      card: settings.og_image ? "summary_large_image" : "summary",
      title: settings.og_title,
      description: settings.og_description,
      images: settings.og_image ? [settings.og_image] : undefined
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="it" className={`${cormorant.variable} ${manrope.variable}`}>
      <body data-csp-nonce={nonce}>{children}</body>
    </html>
  );
}
