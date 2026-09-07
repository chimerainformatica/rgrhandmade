import { PageChrome } from "@/components/PageChrome";
import { LegalBlinkPolicy } from "@/components/legalblink/LegalBlinkPolicy";
import type { LegalBlinkDocument, LegalBlinkLang } from "@/components/legalblink/config";

/**
 * Guscio delle rotte legali.
 *
 * Questo file appartiene al progetto, non al modulo portabile: usa Tailwind e
 * PageChrome. Sta nella cartella per vicinanza, ma un altro progetto lo
 * riscrive col proprio design system.
 */
export function LegalDocumentPage({
  document,
  lang,
  title,
}: {
  document: LegalBlinkDocument;
  lang: LegalBlinkLang;
  title: string;
}) {
  return (
    <>
      <PageChrome initialLang={lang} />
      <main className="min-h-screen bg-warm-black px-4 pb-16 pt-32 text-ivory sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-[clamp(38px,7vw,68px)] font-light leading-[.95]">{title}</h1>
          <LegalBlinkPolicy
            document={document}
            lang={lang}
            title={title}
            className="mt-10"
            frameClassName="w-full min-h-[70vh] rounded-sm border border-gold/25 bg-white"
            fallbackLinkClassName="mt-4 inline-block font-sans text-[12px] uppercase tracking-[.14em] text-gold-light underline underline-offset-4"
          />
        </div>
      </main>
    </>
  );
}
