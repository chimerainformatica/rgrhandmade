import { getDocumentUrl, type LegalBlinkDocument, type LegalBlinkLang } from "./config";

type LegalBlinkPolicyProps = {
  document: LegalBlinkDocument;
  lang: LegalBlinkLang;
  /** Titolo accessibile dell'iframe. Obbligatorio: un iframe senza nome e opaco agli screen reader. */
  title: string;
  className?: string;
  /** Classe dell'iframe. Il modulo non conosce il design system del progetto. */
  frameClassName?: string;
  /** Classe del link di fallback. */
  fallbackLinkClassName?: string;
};

/**
 * Incorpora un documento legale LegalBlink.
 *
 * Se la configurazione manca non rende nulla: la rotta resta valida e mostra
 * il resto della pagina, invece di rompersi.
 *
 * Il link in fondo non e decorativo: se l'iframe non carica — rete, blocco di
 * un'estensione — resta l'unico modo di leggere il documento.
 */
export function LegalBlinkPolicy({
  document,
  lang,
  title,
  className,
  frameClassName,
  fallbackLinkClassName,
}: LegalBlinkPolicyProps) {
  const src = getDocumentUrl(document, lang);
  if (!src) return null;

  return (
    <div className={className}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        className={frameClassName}
        style={frameClassName ? undefined : { border: "none", width: "100%", height: "80vh" }}
      />
      <p>
        <a href={src} target="_blank" rel="noopener noreferrer" className={fallbackLinkClassName}>
          {lang === "it"
            ? "Apri il documento in una nuova scheda"
            : "Open the document in a new tab"}
        </a>
      </p>
    </div>
  );
}
