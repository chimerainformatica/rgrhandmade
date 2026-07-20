import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/privacy/LegalPolicyPage";
import { getPublishedPrivacyConfig } from "@/lib/privacy/server";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description: "Informativa sul trattamento dei dati personali di R.G.R. Handmade.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [{ lang }, config] = await Promise.all([searchParams, getPublishedPrivacyConfig()]);
  return <LegalPolicyPage config={config} lang={lang === "en" ? "en" : "it"} type="privacy" />;
}
