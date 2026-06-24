"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Reveal on scroll ─────────────────────────────────────
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (reduced) {
      els.forEach((el) => el.classList.add("in-view"));
    } else {
      const revealIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in-view");
              revealIo.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );
      els.forEach((el) => revealIo.observe(el));

      // ── Gold hairlines draw-in ──────────────────────────────
      const lineIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("drawn");
              lineIo.unobserve(e.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      document.querySelectorAll(".gold-line").forEach((l) => lineIo.observe(l));

      // ── Pillar number counters ──────────────────────────────
      const counterIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            counterIo.unobserve(el);
            const target = parseInt(el.textContent ?? "0", 10);
            if (isNaN(target)) return;
            const start = performance.now();
            const dur = 900;
            const step = (t: number) => {
              const p = Math.min(1, (t - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = String(Math.round(target * eased)).padStart(2, "0");
              if (p < 1) requestAnimationFrame(step);
              else el.textContent = String(target).padStart(2, "0");
            };
            requestAnimationFrame(step);
          });
        },
        { threshold: 0.4 }
      );
      document.querySelectorAll(".pillar .num").forEach((n) => counterIo.observe(n));

      // ── Parallax on hero corner ─────────────────────────────
      const corner = document.querySelector<HTMLElement>(".hero-corner");
      let ticking = false;
      const onParallax = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            if (corner) corner.style.transform = `translateY(${y * 0.12}px) rotate(${y * 0.02}deg)`;
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener("scroll", onParallax, { passive: true });

      return () => {
        revealIo.disconnect();
        lineIo.disconnect();
        counterIo.disconnect();
        window.removeEventListener("scroll", onParallax);
      };
    }
  }, []);
}
