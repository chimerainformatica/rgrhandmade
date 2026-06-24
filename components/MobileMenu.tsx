"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { BrandLogo, Arrow } from "@/components/Brand";
import type { Lang } from "@/lib/content";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  navItems: Array<{ key: string; label: string }>;
  activeSection: string;
  ctaLabel: string;
  /** Prefisso link: "" in homepage (ancore #home), "/" nelle sotto-pagine (/#home). */
  linkBase?: string;
}

// SVG grain texture per sfondo avorio — opacità 4%, resa impercettibile ma presente
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

// Cubic-bezier tipizzato esplicitamente per soddisfare framer-motion
const EASE_LUXURY = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Varianti module-level — evitano problemi di inferenza TypeScript con union types condizionali
const OVERLAY_VARIANTS: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  visible: { opacity: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 0.65, ease: EASE_LUXURY } },
  exit: { opacity: 0, transition: { duration: 0.35, ease: "easeIn" as const } },
};
const OVERLAY_VARIANTS_REDUCED: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_LUXURY } },
};
const ITEM_VARIANTS_REDUCED: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

function ItalianFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 18 12" aria-hidden="true" className="w-full h-full">
      <rect width="6" height="12" fill="#009246" />
      <rect x="6" width="6" height="12" fill="#fff" />
      <rect x="12" width="6" height="12" fill="#ce2b37" />
    </svg>
  );
}

function UKFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true" className="w-full h-full">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4.5" />
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}

export function MobileMenu({
  isOpen,
  onClose,
  lang,
  setLang,
  navItems,
  activeSection,
  ctaLabel,
  linkBase = "",
}: MobileMenuProps) {
  const prefersReduced = useReducedMotion();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Scroll lock + chiusura con ESC
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Focus automatico al primo link all'apertura
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => firstLinkRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  const overlayVariants = prefersReduced ? OVERLAY_VARIANTS_REDUCED : OVERLAY_VARIANTS;
  const itemVariants = prefersReduced ? ITEM_VARIANTS_REDUCED : ITEM_VARIANTS;

  // Stagger container — ritardo 200ms per lasciar aprire l'overlay prima
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.07,
        delayChildren: prefersReduced ? 0 : 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menu di navigazione"
          className="fixed inset-0 z-60 bg-ivory flex flex-col overflow-y-auto overscroll-contain"
          style={{ backgroundImage: GRAIN_SVG, backgroundSize: "256px 256px" }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Riga logo + close button */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
            <a
              href={`${linkBase}#home`}
              onClick={onClose}
              title="RGR Handmade - home"
              aria-label="RGR Handmade — torna all'inizio"
              className="flex flex-col items-center gap-0.5"
            >
              <BrandLogo className="h-9" />
              <span className="font-sans text-[8.5px] font-medium tracking-[0.28em] uppercase opacity-50 text-warm-black">
                EST. 1989
              </span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi menu"
              className="w-10 h-10 rounded-full border border-gold/60 flex items-center justify-center text-warm-black hover:bg-gold/8 transition-colors duration-200 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Separatore */}
          <div className="mx-6 h-px bg-hairline shrink-0" />

          {/* Contenuto animato con stagger */}
          <motion.div
            className="flex flex-col flex-1 px-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Voci di navigazione */}
            <nav aria-label="Navigazione mobile">
              {navItems.map(({ key, label }, i) => (
                <motion.a
                  key={key}
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={`${linkBase}#${key}`}
                  title={`${label} - RGR Handmade`}
                  onClick={onClose}
                  variants={itemVariants}
                  className={`flex items-center justify-between py-5 border-b border-hairline transition-opacity duration-200 ${
                    activeSection === key ? "opacity-100" : "opacity-60 hover:opacity-95"
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    {/* Dot dorato sulla voce attiva */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-gold shrink-0 transition-opacity duration-200 ${
                        activeSection === key ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className="font-serif font-light tracking-[0.08em] text-warm-black"
                      style={{ fontSize: "clamp(26px, 7vw, 36px)" }}
                    >
                      {label}
                    </span>
                  </span>
                  <span className="text-gold opacity-70">
                    <Arrow size={15} />
                  </span>
                </motion.a>
              ))}
            </nav>

            {/* Selettore lingua IT/EN */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center mt-8"
            >
              <div
                className="inline-flex rounded-full border border-hairline overflow-hidden"
                role="tablist"
                aria-label="Seleziona lingua"
              >
                {(["it", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={lang === l}
                    title={l === "it" ? "Italiano" : "English"}
                    onClick={() => setLang(l)}
                    className={`flex items-center gap-1.75 px-3.5 py-2.25 font-sans text-[10.5px] font-semibold tracking-[0.14em] uppercase transition-all duration-200 ${
                      lang === l
                        ? "bg-warm-black text-ivory"
                        : "bg-transparent text-warm-black/60 hover:text-warm-black"
                    }`}
                  >
                    <span className="w-5 h-3.5 rounded-[3px] overflow-hidden shrink-0 shadow-[0_0_0_0.75px_rgba(0,0,0,0.22)]">
                      {l === "it" ? <ItalianFlag /> : <UKFlag />}
                    </span>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Frase emozionale */}
            <motion.p
              variants={itemVariants}
              className="font-serif italic text-[15px] text-taupe text-center mt-6 px-4 tracking-wide leading-relaxed"
            >
              Tradizione orafa, eleganza senza tempo.
            </motion.p>

            {/* CTA CONTATTI */}
            <motion.div variants={itemVariants} className="mt-8 pb-10">
              <a
                href={`${linkBase}#contact`}
                title={`${ctaLabel} - RGR Handmade`}
                onClick={onClose}
                className="w-full border border-gold text-warm-black flex items-center justify-center gap-3 py-5 font-serif tracking-[0.2em] uppercase hover:bg-gold hover:text-warm-white transition-colors duration-300"
                style={{ fontSize: "clamp(15px, 4.5vw, 18px)" }}
              >
                {ctaLabel}
                <Arrow size={16} />
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
