"use client";

import { motion, useScroll, useTransform, useInView, useReducedMotion, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

interface WireRevealProps {
  children: ReactNode;
  className?: string;
  /** Elemento renderizzato per il titolo. Default: "h2". */
  as?: "div" | "h2" | "h3" | "span";
  /** true (default): rivelazione legata allo scroll. false: one-shot quando entra in view. */
  scrollLinked?: boolean;
}

/**
 * "Filo avvolto" — rivela un titolo con una hairline d'oro che scorre da
 * sinistra a destra, scoprendo il testo dietro di sé (clip-path). Evoca la
 * tecnica firma RGR "filo avvolto su sagoma".
 *
 * Riusa l'easing signature del progetto e i color token --color-gold /
 * --color-gold-light. Rispetta prefers-reduced-motion.
 */
export function WireReveal({
  children,
  className = "",
  as: Tag = "h2",
  scrollLinked = true,
}: WireRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Progress 0→1 che guida sia il clip-path sia la posizione del filo.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.45"],
  });
  const inViewProgress = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (scrollLinked || reduce) return;
    if (inView) {
      const controls = animate(inViewProgress, 1, {
        duration: 0.9,
        ease: [0.16, 0.84, 0.34, 1],
      });
      return () => controls.stop();
    }
  }, [scrollLinked, reduce, inView, inViewProgress]);

  const progress = scrollLinked ? scrollYProgress : inViewProgress;

  // I valori verticali negativi evitano il taglio di accenti / discendenti.
  const clipPath = useTransform(
    progress,
    [0, 1],
    ["inset(-20% 100% -20% 0%)", "inset(-20% 0% -20% 0%)"]
  );
  const wireLeft = useTransform(progress, [0, 1], ["0%", "100%"]);
  const wireOpacity = useTransform(progress, [0, 0.04, 0.9, 1], [0, 1, 1, 0]);

  const MotionTag = motion[Tag] as typeof motion.h2;

  if (reduce) {
    const PlainTag = Tag as "h2";
    return <PlainTag className={className}>{children}</PlainTag>;
  }

  return (
    <div ref={ref} className="relative">
      <MotionTag className={className} style={{ clipPath }}>
        {children}
      </MotionTag>

      {/* Filo d'oro che avvolge il titolo */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-[-8%] bottom-[-8%] w-[2px] rounded-full"
        style={{
          left: wireLeft,
          opacity: wireOpacity,
          background:
            "linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 100%)",
          boxShadow: "0 0 10px rgba(184,146,84,0.55)",
        }}
      />
    </div>
  );
}
