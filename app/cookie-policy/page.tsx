import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/privacy/LegalPolicyPage";
import { getPublishedPrivacyConfig } from "@/lib/privacy/server";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Informativa sui cookie e sulle preferenze privacy di R.G.R. Handmade.",
  alternates: { canonical: "/cookie-policy" },
};

export default async function CookiePolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [{ lang }, config] = await Promise.all([searchParams, getPublishedPrivacyConfig()]);
  return <LegalPolicyPage config={config} lang={lang === "en" ? "en" : "it"} type="cookie" />;
}
