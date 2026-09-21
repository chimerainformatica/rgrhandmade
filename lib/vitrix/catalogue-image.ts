export const CATALOGUE_MIN_SOURCE_EDGE = 2400;

export type CatalogueImageVariant =
  | "editorial-cover"
  | "editorial-cover-full"
  | "compact-card"
  | "wide-card"
  | "grid-card"
  | "modal-thumbnail";

export type CatalogueImagePresentation = {
  source: "original";
  fit: "cover" | "contain";
  sizes: string;
  quality: number;
  uppercaseLabel: boolean;
  labelClassName: string;
};

const PRESENTATIONS: Record<CatalogueImageVariant, CatalogueImagePresentation> = {
  "editorial-cover": {
    source: "original",
    fit: "cover",
    sizes: "(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 48vw, 560px",
    quality: 90,
    uppercaseLabel: false,
    labelClassName: "",
  },
  "editorial-cover-full": {
    source: "original",
    fit: "cover",
    sizes: "(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) calc(100vw - 64px), 1116px",
    quality: 90,
    uppercaseLabel: false,
    labelClassName: "",
  },
  "compact-card": {
    source: "original",
    fit: "cover",
    sizes: "(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 24vw, 280px",
    quality: 90,
    uppercaseLabel: true,
    labelClassName: "font-serif text-[14px] font-bold uppercase tracking-[0.08em]",
  },
  "wide-card": {
    source: "original",
    fit: "contain",
    sizes: "(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 48vw, 560px",
    quality: 90,
    uppercaseLabel: true,
    labelClassName: "font-serif text-[15px] font-bold uppercase tracking-[0.08em]",
  },
  "grid-card": {
    source: "original",
    fit: "cover",
    sizes: "(max-width: 420px) calc(100vw - 32px), (max-width: 768px) 48vw, (max-width: 1180px) 31vw, 280px",
    quality: 88,
    uppercaseLabel: false,
    labelClassName: "",
  },
  "modal-thumbnail": {
    source: "original",
    fit: "cover",
    sizes: "(max-width: 520px) 68px, 82px",
    quality: 88,
    uppercaseLabel: false,
    labelClassName: "",
  },
};

export function getCatalogueImagePresentation(variant: CatalogueImageVariant): CatalogueImagePresentation {
  return PRESENTATIONS[variant];
}

export function getCollectionCardVariant(itemCount: number, index: number): "compact-card" | "wide-card" {
  const fillsRow = itemCount === 1 || (itemCount === 3 && index === 2);
  return fillsRow ? "wide-card" : "compact-card";
}

export function getCatalogueImageQualityWarning(width: number, height: number): string | null {
  if (Math.min(width, height) >= CATALOGUE_MIN_SOURCE_EDGE) return null;

  return `Immagine ${width} x ${height} px: per copertine e zoom nitidi usa almeno ${CATALOGUE_MIN_SOURCE_EDGE} px sul lato corto (consigliati 3200 px).`;
}
