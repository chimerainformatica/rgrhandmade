"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BrandLogo, Arrow } from "@/components/Brand";
import { content, type Lang } from "@/lib/content";

const MobileMenu = dynamic(() => import("@/components/MobileMenu").then((mod) => mod.MobileMenu), { ssr: false });

const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";
const HIDDEN_HOME_SECTIONS = new Set(["atelier"]);
const NAV_IDS = ["home", "about", "collections", "news", "contact"] as const;
const visibleNavItems = (nav: Record<string, string>) =>
  (Object.entries(nav) as [string, string][]).filter(([key]) => !HIDDEN_HOME_SECTIONS.has(key));

/**
 * Header/menu riutilizzabile del sito.
 * - mode="spy"  (homepage): scroll-spy, header trasparente su hero scuro che
 *   diventa bianco-blur allo scroll; link ad ancore (#home…).
 * - mode="solid" (sotto-pagine): header sempre solido chiaro; link a /#home…
 *   tramite linkBase="/".
 */
export function SiteHeader({
  lang,
  setLang,
  mode = "spy",
  linkBase = "",
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  mode?: "spy" | "solid";
  linkBase?: string;
}) {
  const t = content[lang];
  const [activeSection, setActiveSection] = useState(mode === "spy" ? "home" : "");
  const [heroDark, setHeroDark] = useState(mode === "spy");
  const [scrolled, setScrolled] = useState(mode === "solid");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* scroll spy — solo in homepage */
  useEffect(() => {
    if (mode !== "spy") return;
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      let cur = "home";
      for (const id of NAV_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 120) cur = id;
      }
      setActiveSection(cur);
      const hero = document.getElementById("home");
      if (hero) setHeroDark(hero.getBoundingClientRect().bottom > 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  const onDark = mode === "spy" ? heroDark && !scrolled : false;
  const headerSolid = mode === "solid" || scrolled;

  const headerCls = [
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    onDark ? "text-ivory" : "text-warm-black",
    headerSolid
      ? "bg-warm-white/82 backdrop-blur-[18px] backdrop-saturate-150 border-b border-hairline/70 shadow-[0_10px_30px_rgba(23,20,17,0.06)] py-3 max-[640px]:py-2.5"
      : "border-b border-transparent py-[18px] max-[640px]:py-3",
  ].join(" ");

  return (
    <>
      <header className={headerCls}>
        <div className={`${BOXED_CONTAINER} flex min-h-11 items-center justify-between`}>
          {/* Brand */}
          <a href={`${linkBase}#home`} title="RGR Handmade - home" aria-label="RGR Handmade" className="flex min-h-11 flex-col items-center justify-center gap-1 max-[640px]:gap-0.5" onClick={() => setMobileMenuOpen(false)}>
            <BrandLogo inverted={onDark} className="h-9 max-[767px]:h-7 max-[375px]:h-6" />
            <span className="font-sans text-[8.5px] font-medium tracking-[0.28em] uppercase opacity-65 max-[767px]:text-[7.5px] max-[767px]:tracking-[0.22em]">
              {t.header.since}
            </span>
          </a>

          {/* Nav */}
          <nav aria-label="Navigazione principale" className="hidden lg:flex gap-9">
            {visibleNavItems(t.nav).map(([key, label]) => (
              <a key={key} href={`${linkBase}#${key}`} title={`${label} - RGR Handmade`}
                className={`font-sans text-[12.5px] font-medium tracking-[0.14em] uppercase relative py-1 transition-opacity duration-200
                  ${activeSection === key
                    ? "opacity-100 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-px after:bg-gold"
                    : "opacity-80 hover:opacity-100"}`}>
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5 max-[640px]:gap-2">
            <div
              className={`hidden lg:inline-flex items-center rounded-full p-[3px] gap-[2px] border transition-all duration-300
                ${onDark ? "border-white/22 bg-warm-black/25 backdrop-blur-[8px]" : "border-hairline"}`}
              role="tablist"
            >
              {(["it", "en"] as const).map((l) => (
                <button key={l} type="button" title={l === "it" ? "Italiano" : "English"}
                  onClick={() => setLang(l)}
                  className={`flex items-center gap-[7px] px-[11px] py-[6px] rounded-full font-sans text-[10.5px] font-semibold tracking-[0.14em] uppercase transition-all duration-200
                    ${lang === l
                      ? onDark
                        ? "bg-gold/18 text-gold border border-gold/45 opacity-100"
                        : "bg-gold/12 text-gold border border-gold/35 opacity-100"
                      : "opacity-65 hover:opacity-90"}`}>
                  <span className="w-5 h-[14px] rounded-[3px] overflow-hidden flex-shrink-0 shadow-[0_0_0_0.75px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)]">
                    {l === "it" ? (
                      <svg width="20" height="14" viewBox="0 0 18 12" aria-hidden="true" className="w-full h-full">
                        <rect width="6" height="12" fill="#009246" /><rect x="6" width="6" height="12" fill="#fff" /><rect x="12" width="6" height="12" fill="#ce2b37" />
                      </svg>
                    ) : (
                      <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true" className="w-full h-full">
                        <rect width="60" height="40" fill="#012169" />
                        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
                        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4.5" />
                        <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12" />
                        <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
                      </svg>
                    )}
                  </span>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* CTA contatti (Btn gold inline) */}
            <a
              href={`${linkBase}#contact`}
              title={`${t.cta.contact} - RGR Handmade`}
              className={`inline-flex items-center gap-3 px-7 py-4 font-sans text-[12.5px] font-medium tracking-[0.16em] uppercase rounded-full border transition-all duration-300 ease-out hover:-translate-y-px whitespace-nowrap
                bg-transparent text-warm-black border-gold hover:bg-gold hover:text-warm-white
                max-[640px]:hidden lg:inline-flex py-3! px-5.5! ${onDark ? "text-ivory!" : ""}`}
            >
              {t.cta.contact} <Arrow size={12} />
            </a>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-transparent bg-transparent p-0 transition-colors duration-200 hover:border-gold/35 lg:hidden"
              aria-label={mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-overlay"
            >
              <span className={`h-0.5 w-6 rounded transition-all duration-300 ${onDark ? "bg-ivory" : "bg-warm-black"} ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`h-0.5 w-6 rounded transition-all duration-300 ${onDark ? "bg-ivory" : "bg-warm-black"} ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-0.5 w-6 rounded transition-all duration-300 ${onDark ? "bg-ivory" : "bg-warm-black"} ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        lang={lang}
        setLang={setLang}
        navItems={visibleNavItems(t.nav).map(([key, label]) => ({ key, label }))}
        activeSection={activeSection}
        ctaLabel={t.cta.contact}
        linkBase={linkBase}
      />
    </>
  );
}
