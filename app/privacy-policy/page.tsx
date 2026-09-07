import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legalblink/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description: "Informativa sul trattamento dei dati personali di R.G.R. Handmade.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const resolved = lang === "en" ? "en" : "it";
  return <LegalDocumentPage document="privacy" lang={resolved} title={resolved === "en" ? "Privacy notice" : "Informativa privacy"} />;
}
