"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Arrow, SealMark } from "@/components/Brand";
import { Reveal } from "@/components/ui/Reveal";
import { WireReveal } from "@/components/ui/WireReveal";
import { GoldLine } from "@/components/ui/GoldLine";
import { Counter } from "@/components/ui/Counter";
import { SiteHeader } from "@/components/SiteHeader";
import { content, type Lang } from "@/lib/content";
import { SiteFooter } from "@/components/SiteFooter";
import { DEFAULT_VTX_CATALOGUE_CONFIG, DEFAULT_VTX_EVENTS_CONFIG, type VtxCatalogueConfig, type VtxEventsConfig } from "@/lib/vitrix/types";
import type { MediaCollection, MediaCollectionItem } from "@/lib/vitrix/types";

/* -- helpers ------------------------------------------------- */
const asset = (n: string) => `/assets/rgr/${n}`;

const ScrollTextLinesSection = dynamic(
  () => import("@/components/ScrollTextLinesSection").then((mod) => mod.ScrollTextLinesSection),
  { ssr: false },
);
const VtxCatalogueSection = dynamic(
  () => import("@/components/widgets/VtxCatalogueSection").then((mod) => mod.VtxCatalogueSection),
  { ssr: false },
);
const VtxEventsSection = dynamic(
  () => import("@/components/widgets/VtxEventsSection").then((mod) => mod.VtxEventsSection),
  { ssr: false },
);
const WhatsAppFab = dynamic(() => import("@/components/ui/WhatsAppFab").then((mod) => mod.WhatsAppFab), { ssr: false });

const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";

/* -- eyebrow label ------------------------------------------ */
function Eyebrow({ label, onDark = false }: { label: string; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 mb-6">
      <GoldLine onDark={onDark} />
      <span
        className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase"
        style={{ color: onDark ? "var(--color-gold-light)" : "var(--color-gold)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* -- btn ---------------------------------------------------- */
function Btn({
  href, children, variant = "primary", className = "", onClick, title,
}: {
  href: string; children: React.ReactNode;
  variant?: "primary" | "ghost" | "gold" | "on-dark";
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    "inline-flex items-center gap-3 px-7 py-4 font-sans text-[12.5px] font-medium tracking-[0.16em] uppercase rounded-full border transition-all duration-300 ease-out hover:-translate-y-px whitespace-nowrap";
  const variants = {
    primary: "bg-warm-black text-warm-white border-warm-black hover:bg-dark-brown hover:border-dark-brown",
    ghost:   "bg-transparent text-warm-black border-warm-black hover:bg-warm-black hover:text-warm-white",
    gold:    "bg-transparent text-warm-black border-gold hover:bg-gold hover:text-warm-white",
    "on-dark": "bg-transparent text-ivory border-ivory hover:bg-ivory hover:text-warm-black",
  };
  return (
    <a href={href} onClick={onClick} title={title} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </a>
  );
}

/* ========================================================== */
export function HomePage({
  initialLang = "it",
  catalogueConfig = DEFAULT_VTX_CATALOGUE_CONFIG,
  eventsConfig = DEFAULT_VTX_EVENTS_CONFIG,
  catalogueData = null,
}: {
  initialLang?: Lang;
  catalogueConfig?: VtxCatalogueConfig;
  eventsConfig?: VtxEventsConfig;
  catalogueData?: { collection: MediaCollection; items: MediaCollectionItem[] } | null;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = content[lang];

  /* hero seal parallax */
  const { scrollY } = useScroll();
  const sealY      = useTransform(scrollY, [0, 600], [0, 72]);
  const sealRotate = useTransform(scrollY, [0, 600], [0, 12]);

  return (
    <>
      {/* ============ HEADER ============ */}
      <SiteHeader lang={lang} setLang={setLang} mode="spy" />

      {/* ============ HERO ============ */}
      <section id="home" className="relative min-h-screen h-screen bg-warm-black text-ivory overflow-hidden max-[640px]:h-[60vh] max-[640px]:min-h-[60vh] max-[375px]:h-[50vh] max-[375px]:min-h-[50vh]">
        {/* Hero background — video */}
        <video
          className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          src={asset("hero.webm")}
          poster={asset("hero-1.png")}
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{
          background: `linear-gradient(180deg,rgba(23,20,17,.70) 0%,rgba(23,20,17,.45) 30%,rgba(23,20,17,.45) 55%,rgba(23,20,17,.95) 100%),
                       linear-gradient(90deg,rgba(23,20,17,.75) 0%,rgba(23,20,17,.35) 45%,rgba(23,20,17,0) 75%)`
        }} />

        {/* Seal - parallax */}
        <motion.div
          style={{ y: sealY, rotate: sealRotate }}
          className="absolute top-[130px] right-8 z-[3] w-[100px] h-[100px] opacity-85 text-gold-light max-[768px]:hidden"
        >
          <SealMark size={100} />
        </motion.div>


        {/* Hero text */}
        <div className="absolute inset-x-8 bottom-20 z-[2] mx-auto max-w-[1180px] lg:bottom-[130px] max-[768px]:bottom-12 max-[640px]:bottom-8 max-[640px]:inset-x-4">
          <div className="flex items-center gap-3.5 mb-8 max-[640px]:mb-5">
            <GoldLine />
            <span className="font-sans text-[15px] font-bold tracking-[0.22em] uppercase text-gold-light max-[640px]:text-[12px]">
              {t.hero.eyebrow}
            </span>
          </div>
          <h1 className="font-serif font-light leading-[0.92] tracking-[-0.018em] text-warm-white mb-7 max-[640px]:mb-4"
            style={{ fontSize: "clamp(28px,7vw,140px)", textShadow: "0 2px 30px rgba(0,0,0,.45)" }}>
            {t.hero.titlePre}{" "}
            <em className="block not-italic font-light"
              style={{
                fontSize: "45%",
                background: "linear-gradient(180deg,#f4e6c2 0%,#d8be82 60%,#b89254 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 24px rgba(0,0,0,.5))",
                fontStyle: "italic",
              }}>
              {t.hero.titleEm}
            </em>
          </h1>
          <p className="font-sans font-light text-white/88 max-w-[520px] mb-10 max-[640px]:text-[13px] max-[375px]:text-[12px] max-[640px]:mb-5"
            style={{ fontSize: "clamp(14px,1vw,18px)", lineHeight: 1.65, textShadow: "0 1px 14px rgba(0,0,0,.5)" }}>
            {t.hero.lede}
          </p>
          <div className="flex gap-4 flex-wrap max-[640px]:flex-col max-[640px]:gap-2.5">
            <Btn href="#about" variant="primary" title={`${t.cta.primary} - RGR Handmade`}
              className="!bg-gold !border-gold !text-warm-black hover:!bg-dark-brown hover:!border-dark-white hover:!text-warm-white max-[640px]:!py-3 max-[640px]:!px-5 max-[375px]:py-3! max-[375px]:px-5! max-[375px]:!text-[11px]">
              {t.cta.primary} <Arrow size={12} />
            </Btn>
            <Btn href="#collections" variant="on-dark" title={`${t.cta.secondary} - RGR Handmade`} className="max-[640px]:!py-3 max-[640px]:!px-5 max-[375px]:py-3! max-[375px]:px-5! hover:!text-warm-black max-[375px]:!text-[11px]">{t.cta.secondary}</Btn>
          </div>
        </div>

        {/* Meta */}
        <div className="absolute left-8 right-8 bottom-20 z-[3] flex justify-between items-end
          font-sans text-[11px] tracking-[0.22em] uppercase text-white/65 max-[640px]:hidden">
          <span>{t.hero.metaLeft}</span>
          <span>{t.hero.metaRight}</span>
        </div>

        {/* Marquee */}
        <div className="absolute left-0 right-0 bottom-0 h-14 overflow-hidden z-[4] pointer-events-none
          flex items-center border-t border-white/14 max-[640px]:h-12"
          style={{ background: "linear-gradient(180deg,rgba(247,242,234,0) 0%,rgba(247,242,234,.04) 100%)" }}>
          <div className="flex gap-10 whitespace-nowrap animate-marquee font-serif italic text-[18px] text-gold-light max-[640px]:text-[15px] max-[640px]:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="inline-flex items-center gap-8">
                <span>Wire jewellery</span><span className="text-gold text-[10px]">*</span>
                <span>Handmade jewellery</span><span className="text-gold text-[10px]">*</span>
                <span>Gold jewellery</span><span className="text-gold text-[10px]">*</span>
                <span>Stones jewellery</span><span className="text-gold text-[10px]">*</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className="py-20 lg:py-[120px] bg-warm-white">
        <div className={BOXED_CONTAINER}>
          {/* 2-col grid */}
          <div className="grid grid-cols-[1fr_1.1fr] gap-24 items-start max-lg:grid-cols-1 max-lg:gap-12">
            <Reveal>
              <Eyebrow label={t.about.eyebrow} />
              <WireReveal className="font-serif font-normal text-[clamp(24px,5vw,64px)] leading-[1.02] tracking-[-0.005em] text-balance mt-0 mb-10">
                {t.about.titlePre} <em className="italic text-gold">{t.about.titleEm}</em>
              </WireReveal>
              <blockquote className="font-serif italic leading-[1.35] text-dark-brown border-l border-gold pl-7 m-0" style={{ fontSize: "clamp(18px,4.5vw,26px)" }}>
                {t.about.quote}
              </blockquote>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="text-[15.5px] text-dark-brown leading-[1.7] space-y-5">
                <p>
                  <span className="float-left font-serif text-[78px] max-[640px]:text-[52px] max-[420px]:text-[40px] leading-[0.85] pr-3 pt-1.5 text-gold italic">
                    {t.about.paragraphs[0].charAt(0)}
                  </span>
                  {t.about.paragraphs[0].slice(1)}
                </p>
                {t.about.paragraphs.slice(1).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Reveal>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-4 mt-24 max-lg:mt-10 border-t border-b border-hairline max-lg:grid-cols-2 max-[640px]:grid-cols-1">
            {t.pillars.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}
                className={`py-9 px-7 max-[640px]:px-4 ${i > 0 ? "border-l border-hairline max-lg:border-l-0 max-lg:border-t" : ""}`}>
                <div className="font-serif text-[44px] max-[640px]:text-[36px] leading-none text-gold mb-3.5">
                  <Counter value={parseInt(p.num)} />
                </div>
                <div className="font-sans text-[11px] tracking-[0.22em] uppercase font-semibold text-warm-black">{p.label}</div>
                <div className="text-[13.5px] text-taupe mt-2 leading-[1.5]">{p.desc}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ScrollTextLinesSection copy={t.manifesto} lang={lang} />

      {/* ============ COLLECTIONS ============ */}
      <VtxCatalogueSection config={catalogueConfig} lang={lang} catalogueData={catalogueData} />

      {/* ============ NEWS / EVENTI ============ */}
      {eventsConfig.enabled && <VtxEventsSection config={eventsConfig} lang={lang} />}

      <SiteFooter lang={lang} />

      {/* ============ WHATSAPP FAB ============ */}
      <WhatsAppFab label={lang === "it" ? "Scrivici su WhatsApp" : "Chat with us on WhatsApp"} />
    </>
  );
}
