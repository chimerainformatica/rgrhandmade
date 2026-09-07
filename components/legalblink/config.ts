/**
 * Configurazione del modulo LegalBlink.
 *
 * Unico punto da toccare per portare il modulo su un altro progetto: tutto
 * arriva da variabili d'ambiente. Con env assente il modulo resta inerte,
 * cosi il sito gira in locale e in CI senza credenziali Aruba.
 */

export type LegalBlinkDocument = "privacy" | "cookie" | "terms" | "dsar";
export type LegalBlinkLang = "it" | "en";

export type LegalBlinkLoaderAttributes = {
  src: string;
  licenseId: string;
  blockingMode: "auto";
  consentMode: "true";
};

export const LEGALBLINK_LOADER_SRC =
  "https://app.legalblink.it/api/scripts/cmp/loader.js";

/** Id dell'anchor che il CMP lega una volta sola. Vedi LegalBlinkProvider. */
export const LEGALBLINK_SETTINGS_ANCHOR_ID = "legalblink-settings-anchor";

const DOCUMENT_BASE = "https://app.legalblink.it/api/documents";

/**
 * Gli slug restano in italiano in ogni lingua: cambia solo il suffisso.
 * Uno slug tradotto risponde 404.
 */
const DOCUMENT_SLUGS: Record<LegalBlinkDocument, string> = {
  privacy: "privacy-policy-per-siti-web-o-e-commerce",
  cookie: "cookie-policy",
  terms: "condizioni-d'uso-del-sito",
  dsar: "dsar---data-subject-access-request",
};

/**
 * Documenti non ancora generati in inglese nel pannello Aruba: ripiegano
 * sull'italiano invece di servire un 404.
 * Rimuovere la voce non appena la versione EN esiste.
 */
const DOCUMENTS_WITHOUT_EN: ReadonlySet<LegalBlinkDocument> = new Set(["dsar"]);

const licenseId = () => process.env.NEXT_PUBLIC_LEGALBLINK_LICENSE_ID ?? "";
const documentSetId = () =>
  process.env.NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID ?? "";

export function isLegalBlinkEnabled(): boolean {
  return licenseId().length > 0;
}

export function getLoaderAttributes(): LegalBlinkLoaderAttributes | null {
  const id = licenseId();
  if (!id) return null;
  return {
    src: LEGALBLINK_LOADER_SRC,
    licenseId: id,
    blockingMode: "auto",
    consentMode: "true",
  };
}

export function getDocumentUrl(
  doc: LegalBlinkDocument,
  lang: LegalBlinkLang,
): string | null {
  const setId = documentSetId();
  if (!setId) return null;

  const effectiveLang = DOCUMENTS_WITHOUT_EN.has(doc) ? "it" : lang;

  // encodeURIComponent lascia intatti ! ' ( ) * — l'apostrofo di
  // "condizioni-d'uso-del-sito" va quindi codificato a mano.
  const slug = encodeURIComponent(`${DOCUMENT_SLUGS[doc]}-${effectiveLang}`)
    .replace(/['!()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

  return `${DOCUMENT_BASE}/${setId}/${slug}`;
}
