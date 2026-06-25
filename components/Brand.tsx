// Logo RGR con supporto per inversione colore (per sfondi scuri) e classi responsive.
export function BrandLogo({
  inverted = false,
  className = "h-11 max-[640px]:h-7 max-[375px]:h-6"
}: {
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span className="brand-mark brand-mark--logo">
      <img
        src="/assets/rgr/logo-rgr.png"
        alt="R.G.R. Handmade"
        // Combina classi custom con w-auto per preservare aspect ratio.
        className={`${className} w-auto block transition-[filter,height] duration-300`}
        // Filtro dorato per testi su sfondi scuri — mantiene identità brand
        style={inverted
          ? { filter: "brightness(0) invert(1) sepia(0.4) saturate(2.5) hue-rotate(355deg) brightness(1.05)" }
          : undefined}
      />
    </span>
  );
}

// Sigillo con anno di fondazione (1989) e ubicazione (Arezzo)
// Eredita colore dal contesto tramite currentColor
// Su mobile (max-width: 640px) dimensione ridotta del 40%, su extra-small (max-width: 375px) del 30%
export function SealMark({ size = 100 }: { size?: number }) {
  const responsiveSize = `clamp(${Math.round(size * 0.3)}px, 15vw, ${size}px)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      style={{ width: responsiveSize, height: responsiveSize }}
    >
      {/* Cerchi concentrici per frame sigillo */}
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      {/* Croce al centro (asse verticale e orizzontale) */}
      <path d="M50 14 L52 50 L50 86 L48 50 Z" fill="currentColor" opacity="0.6" />
      <path d="M14 50 L50 48 L86 50 L50 52 Z" fill="currentColor" opacity="0.6" />
      {/* Centro del sigillo */}
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      {/* Testo anno fondazione (alto) */}
      <text x="50" y="28" textAnchor="middle" fontFamily="var(--font-manrope, sans-serif)" fontSize="6" letterSpacing="2" fill="currentColor" opacity="0.8">EST · 1989</text>
      {/* Testo ubicazione (basso) */}
      <text x="50" y="78" textAnchor="middle" fontFamily="var(--font-manrope, sans-serif)" fontSize="6" letterSpacing="2" fill="currentColor" opacity="0.8">AREZZO · IT</text>
    </svg>
  );
}

// Freccia direzionale destra con una linea principale e due punte
// Eredita colore dal contesto e dimensioni responsive con clamp
// Su mobile (max-width: 640px) ridotta del 30%, su extra-small (max-width: 375px) del 20%
export function Arrow({ size = 14 }: { size?: number }) {
  const responsiveSize = `clamp(${Math.round(size * 0.2)}px, 3vw, ${size}px)`;

  return (
    <svg
      className="arrow"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ width: responsiveSize, height: responsiveSize }}
    >
      {/* Linea principale orizzontale + punte a V */}
      <path d="M1 8H15M15 8L9 2M15 8L9 14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
