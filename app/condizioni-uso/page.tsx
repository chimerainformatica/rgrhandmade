import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legalblink/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Condizioni d'uso",
  description: "Condizioni d'uso del sito R.G.R. Handmade.",
  alternates: { canonical: "/condizioni-uso" },
};

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const resolved = lang === "en" ? "en" : "it";
  return <LegalDocumentPage document="terms" lang={resolved} title={resolved === "en" ? "Terms of use" : "Condizioni d'uso"} />;
}
