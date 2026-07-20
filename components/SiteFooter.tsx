"use client";

import { BrandLogo } from "@/components/Brand";
import { FooterLegalLinks } from "@/components/FooterLegalLinks";
import { FooterContactForm } from "@/components/FooterContactForm";
import { content, type Lang } from "@/lib/content";
import { ChevronRight, Instagram, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

const asset = (n: string) => `/assets/rgr/${n}`;
const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";
const INSTAGRAM_URL = "https://www.instagram.com/r.g.r.handmade";
const MAPS_URL = "https://www.google.com/maps/dir/43.4700288,11.8325248/Via+Piero+Calamandrei,+253,+52100+Arezzo+AR/@43.4657173,11.8169862,15z/data=!4m10!4m9!1m1!4e1!1m5!1m1!1s0x132bece8e04023b9:0x3875d6f93b97586b!2m2!1d11.8294183!2d43.4591404!3e0?entry=ttu&g_ep=EgoyMDI2MDYyMi4wIKXMDSoASAFQAw%3D%3D";
const SHOW_FOOTER_LEGAL = true;
const HIDDEN_HOME_HREFS = new Set(["#atelier"]);
const visibleExploreLinks = (links: Array<readonly [string, string]>) =>
  links.filter(([, href]) => !HIDDEN_HOME_HREFS.has(href));
const visibleLegalLinks = (links: Array<readonly [string, string]>) =>
  links.filter(([, href]) => ["/privacy-policy", "/cookie-policy", "#cookie-settings"].includes(href));

type SiteFooterProps = {
  lang: Lang;
};

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <>
      <h3 className="m-0 font-serif text-[15px] font-medium uppercase tracking-[0.2em] text-gold-light">{children}</h3>
      <span className="mt-4 block h-px w-7 bg-gold" aria-hidden="true" />
    </>
  );
}

function AtelierSketch() {
  return (
    <svg viewBox="0 0 240 92" className="mt-8 h-auto w-full max-w-[205px] text-gold/45" fill="none" aria-hidden="true">
      <path d="M18 80h204M35 77V34h170v43M27 34h186M48 31l72-25 72 25M64 31l56-19 56 19M53 77V40m134 37V40M75 77V40m90 37V40M97 77V49c0-15 10-24 23-24s23 9 23 24v28M108 77V51c0-8 5-13 12-13s12 5 12 13v26M24 84h192" stroke="currentColor" strokeWidth="1" />
      <path d="M14 88h212M91 43h58M100 55h40" stroke="currentColor" strokeWidth=".7" />
    </svg>
  );
}

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

      <section className="relative overflow-hidden border-t border-white/10 bg-[#0d0b09]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(173,128,55,0.08),transparent_28%),linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.018)_48%,transparent_76%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1480px] px-14 pb-9 pt-20 max-[1100px]:px-8 max-[640px]:px-5 max-[640px]:pb-6 max-[640px]:pt-12">
          <div className={`grid gap-0 max-[1100px]:grid-cols-2 max-[1100px]:gap-x-12 max-[1100px]:gap-y-14 max-[640px]:grid-cols-1 max-[640px]:gap-y-10 ${SHOW_FOOTER_LEGAL ? "grid-cols-[1.35fr_1fr_1fr_1fr_1fr]" : "grid-cols-[1.35fr_1fr_1fr_1fr]"}`}>
            {/* Brand */}
            <div className="pr-12 max-[1100px]:pr-0">
              <BrandLogo className="mb-8 h-[82px] max-[640px]:h-[66px]" />
              <p className="max-w-[330px] font-serif text-[16px] leading-7 text-ivory/70 max-[640px]:text-[15px]">
                {t.footer.claim.split(". ").map((line, index, lines) => (
                  <span key={line} className="block">
                    {line}{index < lines.length - 1 ? "." : ""}
                  </span>
                ))}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram - RGR Handmade"
                  aria-label="Instagram - RGR Handmade"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 text-gold-light transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-warm-black"
                >
                  <Instagram size={18} strokeWidth={1.8} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Atelier */}
            <div className="border-l border-gold/20 px-10 max-[1100px]:border-l-0 max-[1100px]:px-0">
              <FooterHeading>{t.footer.colVisit}</FooterHeading>
              <ul className="mt-7 grid list-none gap-2 p-0">
                <li>
                  <p className="m-0 font-serif text-[16px] leading-7 text-ivory/78 max-[480px]:text-[15px]">{t.footer.addrTitle}</p>
                </li>
                {t.footer.addrLines.map((line) => (
                  <li key={line}>
                    <p className="m-0 font-serif text-[16px] leading-7 text-ivory/58 max-[480px]:text-[15px]">
                      {line}
                    </p>
                  </li>
                ))}
                <li className="pt-1">
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light transition-colors duration-200 hover:text-gold"
                  >
                    Google Maps
                  </a>
                </li>
              </ul>
              <AtelierSketch />
            </div>

            {/* Contact */}
            <div className="border-l border-gold/20 px-10 max-[1100px]:border-l-0 max-[1100px]:px-0">
              <FooterHeading>{t.footer.colContact}</FooterHeading>
              <ul className="mt-7 grid list-none gap-4 p-0">
                {t.footer.contact.map(([label, value]) => (
                  <li key={label}>
                    <a
                      href={label === "Email" ? `mailto:${value}` : `tel:${value.replace(/[^0-9+]/g, "")}`}
                      title={`${label} - RGR Handmade`}
                      className="group flex min-h-12 items-center gap-4 font-serif text-[15px] text-ivory/76 transition-colors hover:text-gold-light"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/55 text-gold transition-colors group-hover:bg-gold group-hover:text-warm-black">
                        {label === "Email" ? <Mail size={17} strokeWidth={1.4} aria-hidden="true" /> : <Phone size={17} strokeWidth={1.4} aria-hidden="true" />}
                      </span>
                      {value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explore */}
            <div className="border-l border-gold/20 pl-10 max-[1100px]:border-l-0 max-[1100px]:pl-0">
              <FooterHeading>{t.footer.colExplore}</FooterHeading>
              <ul className="mt-6 grid list-none gap-1 p-0">
                {visibleExploreLinks(t.footer.explore).map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      title={`${label} - RGR Handmade`}
                      className="group flex min-h-11 items-center justify-between gap-5 font-serif text-[16px] text-ivory/72 transition-colors duration-200 hover:text-gold-light"
                    >
                      <span>{label}</span>
                      <ChevronRight className="text-gold transition-transform group-hover:translate-x-1" size={15} strokeWidth={1.4} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {SHOW_FOOTER_LEGAL && <FooterLegalLinks title={t.footer.colLegalLinks} links={visibleLegalLinks(t.footer.legal)} />}
          </div>

          <div className="relative mt-16 border-t border-gold/55 pt-8 max-[640px]:mt-12">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold bg-[#0d0b09]" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 font-serif text-[12px] tracking-[0.03em] text-ivory/48 max-[700px]:flex-col max-[700px]:items-start">
              <span>&copy; 2026 R.G.R. DI GALLASTRONI ROSSELLA &amp; C. S.N.C. &mdash; Arezzo, Italia</span>
              <span>P.IVA 01358780516</span>
              <span>Handmade &middot; Made in Italy</span>
            </div>
            <div className="mt-6 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-ivory/35">
              Created by{" "}
              <a
                href="https://chimerainformatica.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-light/70 transition-colors duration-200 hover:text-gold-light"
              >
                ChimeraInformatica
              </a>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
