import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legalblink/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Informativa sui cookie e sulle preferenze privacy di R.G.R. Handmade.",
  alternates: { canonical: "/cookie-policy" },
};

export default async function CookiePolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const resolved = lang === "en" ? "en" : "it";
  return <LegalDocumentPage document="cookie" lang={resolved} title="Cookie policy" />;
}
