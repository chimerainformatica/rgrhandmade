import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legalblink/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Richiesta dati personali",
  description: "Come esercitare i diritti sui dati personali presso R.G.R. Handmade.",
  alternates: { canonical: "/richiesta-dati" },
};

export default async function DsarPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const resolved = lang === "en" ? "en" : "it";
  return <LegalDocumentPage document="dsar" lang={resolved} title={resolved === "en" ? "Data subject request" : "Richiesta dati personali"} />;
}
