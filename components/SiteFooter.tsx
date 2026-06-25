"use client";

import { BrandLogo } from "@/components/Brand";
import { FooterContactForm } from "@/components/FooterContactForm";
import { content, type Lang } from "@/lib/content";
import { Facebook, Instagram } from "lucide-react";

const asset = (n: string) => `/assets/rgr/${n}`;
const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";
const INSTAGRAM_URL = "https://www.instagram.com/rgrhandmade/";
const FACEBOOK_URL = "https://www.facebook.com/rgrhandmade/";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Via%20Pietro%20Calamandrei%20253%20A%2F11%2052100%20Arezzo%20Italy";
const HIDDEN_HOME_HREFS = new Set(["#atelier"]);
const visibleExploreLinks = (links: Array<readonly [string, string]>) =>
  links.filter(([, href]) => !HIDDEN_HOME_HREFS.has(href));

type SiteFooterProps = {
  lang: Lang;
};

export function SiteFooter({ lang }: SiteFooterProps) {
  const t = content[lang];

  return (
    <footer id="contact" className="scroll-mt-24 bg-warm-black text-ivory max-[640px]:scroll-mt-28">
      <section className="relative overflow-hidden py-24 max-[640px]:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 18% 10%, rgba(184,146,84,0.18), transparent 28%), linear-gradient(180deg, rgba(255,249,240,0.025), transparent 42%)",
          }}
          aria-hidden="true"
        />
        <div className={`${BOXED_CONTAINER} relative`}>
          <FooterContactForm copy={t.footer.form} imageSrc={asset("hero-3.png")} />
        </div>
      </section>

      <section className="border-t border-white/12 bg-[#120f0d]">
        <div className="mx-auto max-w-[1440px] px-12 pt-14 pb-10 max-[900px]:px-8 max-[640px]:px-4 max-[640px]:pt-10 max-[640px]:pb-6">
          {/* Link grid */}
          <div className="mb-14 grid grid-cols-1 gap-x-16 gap-y-10 sm:grid-cols-2 lg:grid-cols-5 xl:gap-x-16 max-xl:gap-x-10 max-[640px]:mb-10 max-[520px]:gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-2">
              <BrandLogo className="h-14 mb-5" />
              <p className="max-w-sm text-sm leading-6 text-ivory/65">
                {t.footer.claim.split(". ").map((line, index, lines) => (
                  <span key={line} className="block">
                    {line}{index < lines.length - 1 ? "." : ""}
                  </span>
                ))}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram - RGR Handmade"
                  aria-label="Instagram - RGR Handmade"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 text-ivory/62 transition-all duration-200 hover:-translate-y-px hover:border-gold hover:bg-gold hover:text-warm-black"
                >
                  <Instagram size={18} strokeWidth={1.8} aria-hidden="true" />
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook - RGR Handmade"
                  aria-label="Facebook - RGR Handmade"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 text-ivory/62 transition-all duration-200 hover:-translate-y-px hover:border-gold hover:bg-gold hover:text-warm-black"
                >
                  <Facebook size={18} strokeWidth={1.8} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Atelier */}
            <div>
              <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-gold font-semibold mb-4 m-0">
                {t.footer.colVisit}
              </h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                <li>
                  <p className="text-[14px] text-ivory/78 m-0 max-[480px]:text-[13px]">{t.footer.addrTitle}</p>
                </li>
                {t.footer.addrLines.map((line) => (
                  <li key={line}>
                    <p className="text-[14px] m-0 max-[480px]:text-[13px]" style={{ color: "rgba(247,242,234,.55)" }}>
                      {line}
                    </p>
                  </li>
                ))}
                <li className="pt-1">
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-light transition-colors duration-200 hover:text-gold"
                  >
                    Google Maps
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-gold font-semibold mb-4 m-0">
                {t.footer.colContact}
              </h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                {t.footer.contact.map(([label, value]) => (
                  <li key={label}>
                    {label === "Email" ? (
                      <a
                        href={`mailto:${value}`}
                        title={`${label} - RGR Handmade`}
                        className="text-[14px] text-ivory/78 hover:text-gold-light transition-colors duration-200 max-[480px]:text-[13px]"
                      >
                        {value}
                      </a>
                    ) : (
                      <a
                        href={`tel:${value.replace(/[^0-9+]/g, "")}`}
                        title={`${label} - RGR Handmade`}
                        className="text-[14px] text-ivory/78 hover:text-gold-light transition-colors duration-200 max-[480px]:text-[13px]"
                      >
                        {value}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Explore */}
            <div>
              <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-gold font-semibold mb-4 m-0">
                {t.footer.colExplore}
              </h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                {visibleExploreLinks(t.footer.explore).map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      title={`${label} - RGR Handmade`}
                      className="inline-flex min-h-9 items-center text-[14px] text-ivory/78 transition-colors duration-200 hover:text-gold-light max-[480px]:min-h-11 max-[480px]:text-[13px]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-gold font-semibold mb-4 m-0">
                {t.footer.colLegalLinks}
              </h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                {t.footer.legal.map(([label, href]) => (
                  <li key={`${label}-${href}`}>
                    <a
                      href={href === "#admin" ? "/admin/login?next=/admin" : href}
                      title={`${label} - RGR Handmade`}
                      className="inline-flex min-h-9 items-center text-[14px] text-ivory/78 transition-colors duration-200 hover:text-gold-light max-[480px]:min-h-11 max-[480px]:text-[13px]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-x-7 gap-y-2 pt-7 border-t border-white/14 font-sans text-[12px] max-[640px]:justify-start max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-y-1.5 max-[480px]:text-[11px]"
            style={{ color: "rgba(247,242,234,.55)" }}
          >
            <span>&copy; 2026 R.G.R. s.n.c. &mdash; Arezzo, Italy</span>
            <span className="flex flex-wrap gap-x-7 gap-y-2">
              <span>P.IVA 01358780516</span>
              <span>Handmade &middot; Made in Italy</span>
              <span>Design &amp; build &middot; Chimera Informatica</span>
            </span>
          </div>
        </div>
      </section>
    </footer>
  );
}
