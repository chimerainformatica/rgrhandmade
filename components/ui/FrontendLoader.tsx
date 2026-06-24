"use client";

import { DotmTriangle13 } from "@/components/ui/dotm-triangle-13";

type FrontendLoaderProps = {
  label?: string;
  compact?: boolean;
  className?: string;
};

export function FrontendLoader({
  label = "Loading",
  compact = false,
  className = "",
}: FrontendLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center ${compact ? "gap-3 py-3" : "gap-4 py-6"} ${className}`}
      style={{ color: "var(--color-gold)" }}
    >
      <DotmTriangle13 size={compact ? 38 : 52} dotSize={compact ? 4.8 : 6.2} color="var(--color-gold)" bloom halo={0.12} ariaLabel={label} />
      {label ? (
        <span
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-gold)" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
