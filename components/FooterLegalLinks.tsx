"use client";

import { ChevronRight } from "lucide-react";
import { ManageCookiesButton } from "@/components/legalblink/ManageCookiesButton";

type FooterLegalLinksProps = {
  title: string;
  links: Array<readonly [string, string]>;
};

const ROW_CLASS =
  "group flex min-h-11 w-full items-center justify-between gap-5 font-sans text-[14px] text-ivory/78 transition-colors hover:text-gold-light";

function RowContent({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <ChevronRight
        className="text-gold transition-transform group-hover:translate-x-1"
        size={15}
        strokeWidth={1.4}
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Colonna legale del footer: informative, condizioni d'uso, richiesta dati e
 * gestione cookie. I credits stanno solo in SiteFooter.
 *
 * Il filtro delle voci vive in SiteFooter ed e un'enumerazione esplicita:
 * l'elenco di partenza contiene anche il link all'area riservata.
 */
export function FooterLegalLinks({ title, links }: FooterLegalLinksProps) {
  return (
    <div className="border-l border-gold/20 pl-10 max-[1100px]:border-l-0 max-[1100px]:pl-0">
      <h3 className="m-0 font-serif text-[15px] font-medium uppercase tracking-[0.2em] text-gold-light">
        {title}
      </h3>
      <span className="mt-4 block h-px w-7 bg-gold" aria-hidden="true" />
      <ul className="mt-6 grid list-none gap-1 p-0">
        {links.map(([label, href]) => (
          <li key={`${label}-${href}`}>
            {href === "#cookie-settings" ? (
              <ManageCookiesButton label={label} className={ROW_CLASS}>
                <RowContent label={label} />
              </ManageCookiesButton>
            ) : (
              <a href={href === "#admin" ? "/admin/login?next=/admin" : href} className={ROW_CLASS}>
                <RowContent label={label} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
