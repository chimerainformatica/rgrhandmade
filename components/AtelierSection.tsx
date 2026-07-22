"use client";

import type React from "react";
import { Reveal } from "@/components/ui/Reveal";
import { WireReveal } from "@/components/ui/WireReveal";
import { GoldLine } from "@/components/ui/GoldLine";
import type { SiteCopy } from "@/lib/content";

const asset = (name: string) => `/assets/rgr/${name}`;

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

type AtelierSectionProps = {
  copy: SiteCopy["atelier"];
};

export function AtelierSection({ copy }: AtelierSectionProps) {
  return (
    <section id="atelier" className="relative overflow-hidden">
      <div className="grid grid-cols-[1.2fr_1fr] min-h-[720px] max-lg:grid-cols-1 max-[640px]:min-h-auto">
        <Reveal className="relative min-h-120 max-lg:min-h-80 max-[640px]:aspect-video max-[640px]:h-auto">
          <div className="absolute inset-0 overflow-hidden">
            <video
              src={asset("hero-background.webm")}
              poster={asset("hero-2.png")}
              playsInline
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        </Reveal>

        <div className="flex flex-col justify-center px-20 py-[120px] bg-warm-black text-ivory max-lg:px-8 max-lg:py-20 max-[640px]:px-4 max-[640px]:py-16">
          <div className="font-serif italic text-[14px] text-gold tracking-[0.04em] mb-6 opacity-85">Cap. II</div>
          <Reveal>
            <Eyebrow label={copy.eyebrow} onDark />
            <WireReveal className="font-serif font-normal text-[clamp(24px,5vw,64px)] leading-[1.02] text-warm-white mb-8">
              {copy.titlePre} <em className="italic text-gold">{copy.titleEm}</em>
            </WireReveal>
          </Reveal>
          {copy.paragraphs.map((paragraph, index) => (
            <Reveal
              key={index}
              delay={(index + 2) * 0.08}
              className="text-[15.5px] leading-[1.7] mb-4 max-w-[480px]"
              style={{ color: "rgba(247,242,234,.72)" } as React.CSSProperties}
            >
              {paragraph}
            </Reveal>
          ))}
          <div className="flex flex-wrap gap-2 mt-10">
            {copy.tags.map((tag, index) => (
              <Reveal
                key={index}
                delay={index * 0.06}
                as="span"
                className="px-3.5 py-1.5 font-sans text-[10.5px] tracking-[0.2em] uppercase border border-white/14 rounded-full text-gold-light"
              >
                {tag}
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
