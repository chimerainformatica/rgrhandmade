"use client";

import { ChevronRight } from "lucide-react";
import { OPEN_PRIVACY_SETTINGS_EVENT } from "@/lib/privacy/consent";

type FooterLegalLinksProps = {
  title: string;
  links: Array<readonly [string, string]>;
};

/**
 * Sezione conservata separatamente per una futura riattivazione.
 * Include privacy, cookie e area riservata. I credits stanno solo in SiteFooter.
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
            <a
              href={href === "#admin" ? "/admin/login?next=/admin" : href}
              onClick={href === "#cookie-settings" ? (event) => {
                event.preventDefault();
                window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS_EVENT));
              } : undefined}
              className="group flex min-h-11 items-center justify-between gap-5 font-sans text-[14px] text-ivory/78 transition-colors hover:text-gold-light"
            >
              <span>{label}</span>
              <ChevronRight className="text-gold transition-transform group-hover:translate-x-1" size={15} strokeWidth={1.4} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
