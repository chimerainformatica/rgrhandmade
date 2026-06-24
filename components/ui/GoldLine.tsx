"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function GoldLine({ onDark = false }: { onDark?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <motion.span
      ref={ref}
      className="inline-block h-px align-middle origin-left w-12 shrink-0"
      style={{ background: onDark ? "var(--color-gold)" : "var(--color-gold)" }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: isInView ? 1 : 0 }}
      transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
    />
  );
}
