"use client";

import Script from "next/script";
import { isPrivacyCategoryEnabled, type ConsentChoices, type PrivacyConfig } from "@/lib/privacy/types";

export function PrivacyConnectors({ config, choices }: { config: PrivacyConfig; choices: ConsentChoices | null }) {
  const ga4 = config.connectors.ga4;
  const meta = config.connectors.metaPixel;
  return (
    <>
      {ga4.enabled && isPrivacyCategoryEnabled(config, "analytics") && choices?.analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4.measurementId}`} strategy="afterInteractive" />
          <Script id="rgr-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4.measurementId}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {meta.enabled && isPrivacyCategoryEnabled(config, "marketing") && choices?.marketing && (
        <>
          <Script id="rgr-meta-pixel" strategy="afterInteractive">{`window.fbq=window.fbq||function(){(window.fbq.callMethod?window.fbq.callMethod:window.fbq.queue.push).apply(window.fbq,arguments)};window.fbq.queue=window.fbq.queue||[];window.fbq.loaded=true;window.fbq.version='2.0';window.fbq('init','${meta.pixelId}');window.fbq('track','PageView');`}</Script>
          <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
        </>
      )}
    </>
  );
}
