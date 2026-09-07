import Script from "next/script";
import { getLoaderAttributes, LEGALBLINK_SETTINGS_ANCHOR_ID } from "./config";

/**
 * Monta il CMP LegalBlink una sola volta, nel root layout.
 *
 * Lo script gira in beforeInteractive: con blocking-mode auto e i default del
 * Consent Mode v2 deve precedere ogni altro tag, quindi non prima di </body>
 * come indica la guida Aruba.
 *
 * L'anchor nascosto e il trigger che il CMP lega alla propria unica scansione
 * del DOM. Deve restare montato per tutta la vita della pagina: i bottoni
 * visibili gli inoltrano il click tramite ManageCookiesButton.
 */
export function LegalBlinkProvider() {
  const loader = getLoaderAttributes();
  if (!loader) return null;

  return (
    <>
      {/*
        La regola no-before-interactive-script-outside-document e scritta per il
        Pages Router e fa eccezione solo per app/layout.tsx. Qui il provider e
        montato proprio in quel layout: la collocazione e corretta, ma la regola
        non lo vede perche lo script vive in un componente. Tenerlo nel layout
        spezzerebbe il modulo e ne annullerebbe la portabilita.
      */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script
        id="legalblink-loader"
        src={loader.src}
        data-license-id={loader.licenseId}
        data-blocking-mode={loader.blockingMode}
        data-consent-mode={loader.consentMode}
        strategy="beforeInteractive"
      />
      <a
        id={LEGALBLINK_SETTINGS_ANCHOR_ID}
        href="#"
        data-lb="c-settings"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      />
    </>
  );
}
