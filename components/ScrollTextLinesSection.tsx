"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { GoldLine } from "@/components/ui/GoldLine";
import type { Lang } from "@/lib/content";

type ScrollTextLinesCopy = {
  eyebrow: string;
  ariaLabel: string;
  lines: readonly string[];
};

type Props = {
  copy: ScrollTextLinesCopy;
  lang: Lang;
};

const rowStyles = [
  {
    className: "font-sans text-ivory",
    strokeColor: "rgba(247, 242, 234, 0.34)",
    from: "-10%",
    to: "12%",
  },
  {
    className: "font-sans text-gold-light",
    strokeColor: "rgba(216, 190, 130, 0.38)",
    from: "10%",
    to: "-16%",
  },
  {
    className: "font-sans text-ivory",
    strokeColor: "rgba(247, 242, 234, 0.28)",
    from: "-18%",
    to: "8%",
  },
  {
    className: "font-sans text-gold",
    strokeColor: "rgba(184, 146, 84, 0.42)",
    from: "16%",
    to: "-10%",
  },
  {
    className: "font-sans text-ivory",
    strokeColor: "rgba(247, 242, 234, 0.32)",
    from: "-8%",
    to: "18%",
  },
] as const;

function ScrollTextLine({
  text,
  progress,
  index,
  reduceMotion,
}: {
  text: string;
  progress: MotionValue<number>;
  index: number;
  reduceMotion: boolean;
}) {
  const style = rowStyles[index % rowStyles.length];
  const x = useTransform(progress, [0, 1], [style.from, style.to]);
  const repeated = Array.from({ length: 5 }, (_, i) => (
    <span key={`${text}-${i}`} className="inline-flex items-center gap-16 pr-16">
      <span className="inline-block whitespace-nowrap uppercase font-black tracking-[0.01em]">
        {text}
      </span>
      <span
        className="inline-block whitespace-nowrap uppercase font-black tracking-[0.01em]"
        style={{
          WebkitTextStroke: `1.6px ${style.strokeColor}`,
          color: "transparent",
          paintOrder: "stroke fill",
        }}
      >
        {text}
      </span>
    </span>
  ));

  return (
    <div className="relative overflow-hidden py-1.5 max-[640px]:py-1">
      <motion.div
        className={`flex w-max whitespace-nowrap text-[32px] leading-[0.9] md:text-[54px] lg:text-[78px] ${style.className}`}
        style={reduceMotion ? undefined : { x }}
        aria-hidden="true"
      >
        {repeated}
      </motion.div>
    </div>
  );
}

export function ScrollTextLinesSection({ copy, lang }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      aria-label={copy.ariaLabel}
      className="relative isolate overflow-hidden bg-warm-black py-10 text-ivory md:py-14 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />
        <div className="absolute left-8 top-0 h-full w-px bg-gold/20 max-[640px]:left-4" />
      </div>

      <div className="relative z-10 mb-8 px-8 max-[640px]:mb-5 max-[640px]:px-4">
        <div className="flex items-center gap-3.5">
          <GoldLine onDark />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-light">
            {copy.eyebrow}
          </span>
        </div>
      </div>

      <p className="sr-only">{copy.lines.join(" / ")}</p>

      <div className="relative z-10 flex flex-col gap-4 max-[640px]:gap-2">
        {copy.lines.map((line, index) => (
          <ScrollTextLine
            key={`${lang}-${line}`}
            text={line}
            progress={scrollYProgress}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
