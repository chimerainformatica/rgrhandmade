"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export function Counter({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => String(Math.round(v)).padStart(2, "0"));

  useEffect(() => {
    if (!isInView) return;
    const ctrl = animate(mv, value, { duration: 0.9, ease: [0, 0, 0.2, 1] });
    return ctrl.stop;
  }, [isInView, mv, value]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
