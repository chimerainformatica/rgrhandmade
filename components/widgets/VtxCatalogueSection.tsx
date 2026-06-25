"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Arrow } from "@/components/Brand";
import { Reveal } from "@/components/ui/Reveal";
import { GoldLine } from "@/components/ui/GoldLine";
import { WireReveal } from "@/components/ui/WireReveal";
import { CatalogueHeaderSkeleton, CatalogueSkeleton, CatalogueTabsSkeleton, PreviewModalSkeleton } from "@/components/ui/Skeleton";
import type { Lang } from "@/lib/content";
import { useCollections, type CollectionRow } from "@/lib/useSupabase";
import type { MediaCollection, MediaCollectionItem, VtxCatalogueConfig } from "@/lib/vitrix/types";
import {
  getThumbnailImageUrl,
  getPreviewImageUrl,
  getZoomImageUrl,
  preloadImage,
} from "@/lib/vitrix/image";

const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";
const MIN_PREVIEW_LOADING_MS = 180;

const CATEGORY_LABELS: Record<string, { it: string; en: string }> = {
  Anelli: { it: "Anelli", en: "Rings" },
  Bracciali: { it: "Bracciali", en: "Bracelets" },
  Collane: { it: "Collane", en: "Necklaces" },
  Orecchini: { it: "Orecchini", en: "Earrings" },
  Parure: { it: "Parure", en: "Parure" },
};

const ALL_LABEL = { it: "Tutte", en: "All" };

/** Legacy RGR category used only as fallback for data predating Collection standardization. */
const PARURE_CATEGORY = "Parure";

/** Zoom scale factor for the magnifying lens on the main preview image. */
const ZOOM_SCALE = 2.1;

interface Props {
  config: VtxCatalogueConfig;
  lang: Lang;
  catalogueData?: { collection: MediaCollection; items: MediaCollectionItem[] } | null;
}

function normalizeSelectedItems(items: MediaCollectionItem[]): CollectionRow[] {
  return items.map((item) => ({
    id: Number.parseInt(item.id.replace(/\D/g, ""), 10) || item.sort_order || 0,
    ref: item.tags[0] || item.slug.toUpperCase(),
    title: item.title,
    description: item.description,
    category: item.category || "All",
    img_path: item.url,
    img_position: null,
    lang: "it",
    status: item.status,
    sort_order: item.sort_order,
    item_type: "item",
    parent_id: null,
    parure_id: null,
  }));
}

/* Collection logic / randomization
 * Data model:
 *  - collection    -> item_type === "collection" (editorial container)
 *  - element       -> parent_id === id-of-the-collection
 *  - single item   -> item_type === "item" && parent_id === null
 * In the "All" tab we show collections + single items, excluding children.
 */

function isCollection(card: CollectionRow): boolean {
  if (card.item_type === "collection" || card.item_type === "item") {
    return card.item_type === "collection";
  }
  return card.category === PARURE_CATEGORY;
}

function parentIdOf(card: CollectionRow): number | null {
  return card.parent_id ?? card.parure_id ?? null;
}

function getCollectionElements(head: CollectionRow, all: CollectionRow[]): CollectionRow[] {
  return all
    .filter((c) => parentIdOf(c) === head.id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function hasLinkedItems(head: CollectionRow, all: CollectionRow[]): boolean {
  return getCollectionElements(head, all).length > 0;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function singularizeLabel(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (normalized.endsWith("i") || normalized.endsWith("e")) return normalized.slice(0, -1);
  return normalized;
}

function shouldShowDescription(card: CollectionRow): boolean {
  const title = singularizeLabel(card.title);
  const description = singularizeLabel(card.description);
  return Boolean(description) && description !== title;
}

function itemCategoryLabel(category: string, lang: Lang): string {
  if (lang === "en") {
    const en = CATEGORY_LABELS[category]?.en ?? category;
    if (en === "Bracelets") return "Bracelet";
    if (en === "Necklaces") return "Necklace";
    if (en === "Earrings") return "Earring";
    if (en === "Rings") return "Ring";
    return en;
  }

  if (category === "Bracciali") return "Bracciale";
  if (category === "Collane") return "Collana";
  if (category === "Orecchini") return "Orecchino";
  if (category === "Anelli") return "Anello";
  return CATEGORY_LABELS[category]?.it ?? category;
}

/**
 * Builds the items to display in the grid:
 *  - "All" tab: collections + single items, mixed together;
 *  - other tabs: filter by category, stable order.
 */
function getGridItems(items: CollectionRow[], activeKey: string, limit: number): CollectionRow[] {
  const visibleItems = items.filter((card) => !isCollection(card) || hasLinkedItems(card, items));
  const base = activeKey === "all"
    ? visibleItems.filter((card) => parentIdOf(card) == null)
    : visibleItems.filter((card) => card.category === activeKey);

  if (activeKey === "all") {
    const collections = base.filter((card) => isCollection(card)).sort((a, b) => a.sort_order - b.sort_order);
    const others = base.filter((card) => !isCollection(card)).sort((a, b) => a.sort_order - b.sort_order);
    const ordered = [...collections, ...others];
    return limit > 0 ? ordered.slice(0, limit) : ordered;
  }

  return limit > 0 ? [...base].slice(0, limit) : [...base];
}

function CollectionImage({
  card,
  variant = "thumb",
  className = "",
  fit = "cover",
}: {
  card: CollectionRow;
  variant?: "thumb" | "preview";
  className?: string;
  fit?: "cover" | "contain";
}) {
  const src = variant === "preview" ? getPreviewImageUrl(card.img_path) : getThumbnailImageUrl(card.img_path);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <div className={`h-full w-full bg-[#d5cfc8] ${className}`} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={card.title}
      className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
      style={{ objectPosition: card.img_position || "center" }}
      width={variant === "preview" ? 1600 : 720}
      height={variant === "preview" ? 2133 : 960}
      sizes={variant === "preview"
        ? "(max-width: 520px) 100vw, (max-width: 860px) 50vw, 45vw"
        : "(max-width: 420px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"}
      loading={variant === "preview" ? "eager" : "lazy"}
      fetchPriority={variant === "preview" ? "high" : "auto"}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

/**
 * Editorial block for a collection in the "All" tab:
 * left side: hero image with gradient overlay + text (eyebrow, italic title,
 * description, CTA), right side: 2x2 mini-grid of the set elements.
 * Layout: grid 1.05fr / 1.1fr, fixed height ~390px.
 */
function CollectionBlock({
  head,
  allItems,
  lang,
  ctaLabel,
  showRefBadge,
  onOpen,
  reverse = false,
  showMiniOverlay = false,
}: {
  head: CollectionRow;
  allItems: CollectionRow[];
  lang: Lang;
  ctaLabel: string;
  showRefBadge: boolean;
  onOpen: (head: CollectionRow, view: CollectionRow) => void;
  reverse?: boolean;
  /** Shows the old category label overlaid on the image (default: hidden) */
  showMiniOverlay?: boolean;
}) {
  const elements = getCollectionElements(head, allItems).slice(0, 4);
  const hasGallery = elements.length > 0;
  const galleryLayoutClass = elements.length === 1
    ? "grid-cols-1 grid-rows-1"
    : elements.length === 2
      ? "grid-cols-2 grid-rows-1 max-[760px]:grid-cols-1 max-[760px]:grid-rows-2"
      : "grid-cols-2 grid-rows-2";

  return (
    <section
      className={[
        "grid items-stretch",
        hasGallery ? "grid-cols-[1.02fr_1.08fr]" : "grid-cols-1",
        "gap-3 max-[900px]:gap-2",
        "max-[760px]:grid-cols-1",
      ].join(" ")}
    >
      {/* Left column: hero image with overlay */}
      <button
        type="button"
        onClick={() => onOpen(head, head)}
        className={`group relative overflow-hidden border bg-[#e8dfd0] text-left aspect-[3/4] shadow-[0_18px_48px_rgba(51,38,25,0.16)] max-[760px]:order-first max-[640px]:aspect-auto max-[640px]:min-h-[380px] max-[380px]:min-h-[340px] ${reverse && hasGallery ? "order-2" : ""}`}
        style={{ borderColor: "#d8c8b4" }}
        aria-label={(lang === "it" ? "Apri anteprima " : "Open preview ") + head.title}
      >
        {/* Collection image (without zoom) */}
        <div className="absolute inset-0">
          <CollectionImage card={head} variant="preview" />
        </div>

        {/* Gradient overlay from bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(20,18,16,0.72) 0%, rgba(20,18,16,0.28) 45%, rgba(20,18,16,0.05) 100%)",
          }}
        />

        {/* Text at bottom left */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-7 pb-7 max-[520px]:px-5 max-[520px]:pb-5">
          {/* Eyebrow "RGR COLLECTION" */}
          <span
            className="mb-2 font-sans font-semibold uppercase"
            style={{ fontSize: "12px", letterSpacing: "2.5px", color: "#c0a16f" }}
          >
            RGR COLLECTION
          </span>

          {/* Collection title: italic, large */}
          <h3
            className="m-0 font-serif font-normal italic leading-none text-white"
            style={{ fontSize: "clamp(38px, 4.5vw, 52px)" }}
          >
            {head.title}
          </h3>

          {/* Collection description */}
          {shouldShowDescription(head) && (
            <p
              className="mt-2 font-serif text-white/90 max-w-xs max-[520px]:hidden"
              style={{ fontSize: "19px", lineHeight: "1.3" }}
            >
              {head.description}
            </p>
          )}

          {/* Call-to-Action */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              const contactForm = document.getElementById("contact");
              if (contactForm) {
                contactForm.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="mt-5 inline-flex items-center border border-gold/55 bg-warm-black/18 px-4 py-2 font-sans font-semibold uppercase text-gold-light backdrop-blur-sm transition-all duration-200 hover:border-gold-light hover:bg-warm-black/32 hover:text-ivory"
            style={{ fontSize: "11px", letterSpacing: "1.8px" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const contactForm = document.getElementById("contact");
                if (contactForm) {
                  contactForm.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }
            }}
          >
            {ctaLabel} &rarr;
          </div>
        </div>
      </button>

      {/* Right column: mini-grid that fills exactly the height of the hero */}
      {hasGallery && (
        <div
          className={`grid h-full min-h-[520px] gap-3 max-[900px]:gap-2 max-[760px]:min-h-0 ${galleryLayoutClass} ${reverse ? "order-1" : ""}`}
        >
          {elements.map((item, idx) => {
            const isWide = elements.length === 3 && idx === 2;
            const colSpan = isWide ? "col-span-2" : "";
            const imageInset = elements.length === 1
              ? "p-10 max-[980px]:p-7 max-[640px]:p-5"
              : "p-5 max-[980px]:p-4 max-[640px]:p-4";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(head, item)}
                className={`group relative flex min-h-[250px] flex-col overflow-hidden bg-[#fbf8f1] text-left shadow-[0_12px_28px_rgba(60,44,28,0.08)] transition-transform duration-300 hover:-translate-y-0.5 max-[640px]:min-h-[210px] max-[380px]:min-h-[190px] ${colSpan}`}
                style={{ border: "1px solid rgba(216,200,180,0.72)" }}
                aria-label={(lang === "it" ? "Apri anteprima " : "Open preview ") + item.title}
              >
                {/* Image */}
                <div className="relative flex-1 overflow-hidden bg-[#fffdf8]">
                  <div className={`absolute inset-0 ${imageInset} transition-transform duration-500 ease-out group-hover:scale-[1.04]`}>
                    <CollectionImage card={item} variant="thumb" fit="contain" />
                  </div>

                  {/* Hover overlay with "Preview" */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/15">
                    <span
                      className="font-serif italic tracking-wide text-white translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ fontSize: "clamp(15px, 2vw, 20px)", textShadow: "0 1px 6px rgba(0,0,0,0.25)" }}
                    >
                      {lang === "it" ? "Anteprima" : "Preview"}
                    </span>
                  </div>

                  {/* Title overlay */}
                  {showMiniOverlay && (
                    <span
                      className="absolute bottom-0 left-0 right-0 px-[18px] py-[14px] font-serif"
                      style={{
                        fontSize: "17px",
                        color: "#3a332d",
                        background: "linear-gradient(to top, rgba(246,239,229,0.82) 0%, rgba(246,239,229,0) 100%)",
                      }}
                    >
                      {item.title}
                    </span>
                  )}
                </div>

                {/* Footer: ref + title */}
                <div className="flex shrink-0 items-end justify-between gap-3 border-t border-[#d8c8b4]/35 bg-[#f7f0e6]/82 px-4 py-3">
                  <div className="min-w-0">
                    {showRefBadge && (
                      <span className="block text-[10px] uppercase text-gold font-semibold" style={{ letterSpacing: "0.18em" }}>{item.ref}</span>
                    )}
                    <span className="block truncate font-serif text-[15px] font-normal leading-[1.2] text-warm-black">
                      {item.title}
                    </span>
                  </div>
                  <span className="hidden h-px w-8 shrink-0 bg-gold/35 min-[900px]:block" aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Collection detail modal: image on left + item grid on right. */
function CollectionDetailModal({
  head,
  elements,
  config,
  lang,
  onClose,
  onOpenItem,
}: {
  head: CollectionRow;
  elements: CollectionRow[];
  config: VtxCatalogueConfig;
  lang: Lang;
  onClose: () => void;
  onOpenItem: (item: CollectionRow) => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,18,16,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full overflow-hidden bg-ivory"
        style={{ maxWidth: "1060px", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full border border-hairline text-taupe transition-all hover:border-warm-black hover:text-warm-black"
          aria-label={lang === "it" ? "Chiudi" : "Close"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        {/* Sinistra: immagine collezione */}
        <div className="relative shrink-0 max-[680px]:hidden" style={{ width: "52%" }}>
          <div className="absolute inset-0">
            <CollectionImage card={head} variant="preview" />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(20,18,16,0.65) 0%, rgba(20,18,16,0.10) 50%, rgba(20,18,16,0) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 px-8 pb-8">
            <span
              className="font-sans font-semibold uppercase"
              style={{ fontSize: "11px", letterSpacing: "2.5px", color: "#c0a16f" }}
            >
              RGR COLLECTION
            </span>
            <h2
              className="mt-1 font-serif font-normal italic leading-none text-white"
              style={{ fontSize: "clamp(34px, 3.8vw, 50px)" }}
            >
              {head.title}
            </h2>
          </div>
        </div>

        {/* Destra: header + griglia pezzi */}
        <div className="flex flex-1 flex-col overflow-y-auto px-8 py-10 max-[680px]:px-5 max-[680px]:py-8">
          <div className="mb-6 pr-8">
            <span
              className="font-sans font-semibold uppercase text-gold"
              style={{ fontSize: "11px", letterSpacing: "2.5px" }}
            >
              {lang === "it" ? "Collezione" : "Collection"}
            </span>
            <h2
              className="mt-1 font-serif font-normal italic leading-tight text-warm-black"
              style={{ fontSize: "clamp(26px, 3.2vw, 38px)" }}
            >
              {head.title}
            </h2>
            {shouldShowDescription(head) && (
              <p className="mt-2 font-serif text-taupe leading-[1.5]" style={{ fontSize: "14.5px" }}>
                {head.description}
              </p>
            )}
            <div className="mt-4 h-px w-10 bg-gold/40" />
          </div>

          {elements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[340px]:grid-cols-1">
              {elements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="group relative flex flex-col overflow-hidden bg-[#f6efe5] text-left"
                  style={{ border: "1px solid #d8c8b4" }}
                  aria-label={(lang === "it" ? "Anteprima " : "Preview ") + itemCategoryLabel(item.category, lang)}
                >
                  <div className="relative overflow-hidden bg-white" style={{ aspectRatio: "1/1", padding: "16px" }}>
                    <div className="absolute inset-0 p-4 transition-transform duration-500 group-hover:scale-[1.05]">
                      <CollectionImage card={item} variant="thumb" fit="contain" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/15">
                      <span
                        className="font-serif italic text-white translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                        style={{ fontSize: "15px", textShadow: "0 1px 6px rgba(0,0,0,0.25)" }}
                      >
                        {lang === "it" ? "Anteprima" : "Preview"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[2px] px-3 py-2 border-t border-[#d8c8b4]/40">
                    {config.show_ref_badge && (
                      <span className="text-[9.5px] tracking-[0.2em] uppercase text-gold font-medium">{item.ref}</span>
                    )}
                    <span className="font-serif text-[13px] leading-[1.2] text-warm-black">
                      {itemCategoryLabel(item.category, lang)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="font-serif italic text-taupe" style={{ fontSize: "15px" }}>
              {lang === "it" ? "Nessun pezzo disponibile." : "No pieces available."}
            </p>
          )}

          {config.show_cta && (
            <div className="mt-6 pt-5 border-t border-hairline">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const contactForm = document.getElementById("contact");
                  if (contactForm) {
                    setTimeout(() => {
                      contactForm.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 200);
                  }
                }}
                className="font-sans font-semibold uppercase text-gold transition-opacity hover:opacity-70"
                style={{ fontSize: "12px", letterSpacing: "2px" }}
              >
                {config.cta_label[lang]} &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Piccolo fregio decorativo (diamante centrale con due linee dorate). */
function Ornament() {
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      <span className="h-px w-8 bg-gold/40" />
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M7 0l7 7-7 7-7-7z" fill="var(--color-gold)" />
      </svg>
      <span className="h-px w-8 bg-gold/40" />
    </div>
  );
}

/**
 * Immagine principale dell'anteprima con effetto "lente di ingrandimento".
 * Al passaggio del mouse l'immagine viene ingrandita (ZOOM_SCALE) e il punto
 * di origine della trasformazione segue il cursore -> zoom fluido sul dettaglio.
 * Su touch / fuori hover torna allo stato 1:1.
 */
function ZoomImage({ card }: { card: CollectionRow }) {
  const src = getZoomImageUrl(card.img_path);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("center");
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!src || failed) {
    return <div className="h-full w-full bg-[#d5cfc8]" aria-hidden="true" />;
  }

  return (
    <div
      className="relative h-full w-full cursor-zoom-in overflow-hidden"
      onMouseEnter={() => setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMove}
    >
      {!loaded && <div className="absolute inset-0 z-10 skeleton" />}
      <img
        src={src}
        alt={card.title}
        className="h-full w-full select-none object-contain transition-transform duration-300 ease-out will-change-transform"
        style={{
          opacity: loaded ? 1 : 0,
          transform: zooming ? `scale(${ZOOM_SCALE})` : "scale(1)",
          transformOrigin: origin,
          objectPosition: card.img_position || "center",
        }}
        draggable={false}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function GridCard({
  card, i, config, lang, onOpen,
}: {
  card: CollectionRow;
  i: number;
  config: VtxCatalogueConfig;
  lang: Lang;
  onOpen: (head: CollectionRow, viewItem: CollectionRow) => void;
}) {
  const ctaLabel = lang === "it" ? "Anteprima" : "Preview";

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(card, card)}
      className="relative w-full cursor-pointer border-0 bg-transparent p-0 text-left"
      initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      whileHover="hover"
      style={{ "--card-delay": `${i * 60}ms` } as CSSProperties}
      transition={{ delay: i * 0.06, duration: 0.58, ease: [0.2, 0.7, 0.2, 1] }}
      aria-label={(lang === "it" ? "Apri anteprima " : "Open preview ") + card.title}
    >
      <div className="relative aspect-[4/5] overflow-hidden mb-3.5 bg-[#d5cfc8]">
        <motion.div
          className="absolute inset-0 z-[2] h-full w-full origin-center"
          variants={{
            rest: { scale: 1, y: 0 },
            hover: { scale: 1.04, y: -8 },
          }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <CollectionImage card={card} variant="thumb" />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-[4] flex items-end"
          style={{ background: "linear-gradient(0deg,rgba(23,20,17,.88) 0%,rgba(23,20,17,.4) 50%,rgba(23,20,17,0) 70%)" }}
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 flex flex-col gap-1.5">
            {config.show_ref_badge && (
              <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-gold-light font-medium">{card.ref}</span>
            )}
            <span className="font-serif text-[24px] text-warm-white leading-[1.1]">{itemCategoryLabel(card.category, lang)}</span>
            <motion.span
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.18em] uppercase text-gold-light mt-1"
              variants={{ rest: { x: -4 }, hover: { x: 0 } }}
              transition={{ duration: 0.3 }}
            >
              {ctaLabel} <Arrow size={11} />
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 z-[5] pointer-events-none border border-gold"
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="flex min-h-[20px] flex-col gap-[3px]">
        {config.show_ref_badge && (
          <span className="text-[10px] tracking-[0.2em] uppercase text-gold font-medium">{card.ref}</span>
        )}
        <span className="font-serif text-[19px] font-normal leading-[1.15] text-warm-black">{card.title}</span>
      </div>
    </motion.button>
  );
}

function PreviewModal({
  card,
  allItems,
  initialViewId = null,
  lang,
  ctaLabel,
  showCta = true,
  onClose,
}: {
  card: CollectionRow | null;
  allItems: CollectionRow[];
  initialViewId?: number | null;
  lang: Lang;
  ctaLabel?: string;
  showCta?: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  // Vista attiva nell'anteprima: di default la collection,
  // poi aggiornata al click su un thumbnail (elemento del set).
  const [active, setActive] = useState<CollectionRow | null>(card);

  // Insieme di immagini mostrabili: per una collection = testa + elementi,
  // per un articolo singolo = solo se stesso.
  const views = useMemo<CollectionRow[]>(() => {
    if (!card) return [];
    return isCollection(card) ? [card, ...getCollectionElements(card, allItems)] : [card];
  }, [card, allItems]);

  // All'apertura riparti dalla vista richiesta (elemento cliccato) o,
  // in mancanza, dalla vista principale (collection / articolo).
  useEffect(() => {
    if (!card) {
      setActive(null);
      return;
    }
    const requested = initialViewId != null ? views.find((v) => v.id === initialViewId) : undefined;
    setActive(requested ?? card);
  }, [card, initialViewId, views]);

  const view = active ?? card;

  useEffect(() => {
    if (!card) return;
    const src = getPreviewImageUrl(card.img_path);
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setImageReady(false);
    setImageError(false);
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    let cancelled = false;
    let readyTimer: number | null = null;
    const startedAt = performance.now();
    const finishReady = () => {
      const elapsed = performance.now() - startedAt;
      const wait = Math.max(MIN_PREVIEW_LOADING_MS - elapsed, 0);
      readyTimer = window.setTimeout(() => {
        if (!cancelled) setImageReady(true);
      }, wait);
    };

    if (!src) {
      finishReady();
    } else {
      const image = new window.Image();
      image.onload = () => {
        if (!cancelled) finishReady();
      };
      image.onerror = () => {
        if (!cancelled) {
          setImageError(true);
          finishReady();
        }
      };
      image.src = src;
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      if (readyTimer) window.clearTimeout(readyTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousActive?.focus();
    };
  }, [card, onClose]);

  if (!card || !view) return null;

  if (!imageReady) {
    return (
      <div
        className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-warm-black/70 px-4 py-8 backdrop-blur-[10px]"
        role="dialog"
        aria-modal="true"
        aria-label={lang === "it" ? "Anteprima collezione" : "Collection preview"}
        aria-busy="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/28 bg-warm-black/60 font-sans text-[13px] font-semibold text-ivory backdrop-blur transition hover:bg-warm-black"
          aria-label={lang === "it" ? "Chiudi anteprima" : "Close preview"}
        >
          X
        </button>

        <PreviewModalSkeleton />
      </div>
    );
  }

  const currentIndex = Math.max(0, views.findIndex((v) => v.id === view.id));
  const go = (delta: number) => {
    if (views.length < 2) return;
    const next = (currentIndex + delta + views.length) % views.length;
    setActive(views[next]);
  };
  const ctaText = ctaLabel ?? (lang === "it" ? "Richiedi informazioni" : "Request information");

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-warm-black/55 px-4 py-8 backdrop-blur-[14px]"
      role="dialog"
      aria-modal="true"
      aria-label={lang === "it" ? "Anteprima collezione" : "Collection preview"}
      aria-busy={!imageReady}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="relative grid w-full max-w-[1060px] max-h-[calc(100svh-3rem)] grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[22px] border border-white/50 bg-ivory shadow-[0_44px_120px_rgba(40,30,18,0.4)] max-[860px]:max-w-[560px] max-[860px]:grid-cols-1 max-[860px]:max-h-[calc(100svh-2rem)] max-[860px]:overflow-y-auto"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-full text-warm-black/55 transition hover:bg-warm-black/10 hover:text-warm-black"
          aria-label={lang === "it" ? "Chiudi anteprima" : "Close preview"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        {/* Left column: main image (zoom-lens) + arrows + circular thumbnails */}
        <div className="flex flex-col gap-7 p-4 max-[520px]:gap-5 max-[520px]:p-2">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-white shadow-[0_26px_60px_rgba(40,30,18,0.16)]">
              {imageError ? (
                <div className="h-full w-full bg-white" aria-hidden="true" />
              ) : (
                <ZoomImage key={view.id} card={view} />
              )}
            </div>

            {views.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-ivory/95 text-warm-black shadow-[0_8px_22px_rgba(40,30,18,0.18)] transition hover:bg-warm-black hover:text-ivory max-[520px]:h-9 max-[520px]:w-9"
                  aria-label={lang === "it" ? "Elemento precedente" : "Previous item"}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-hairline bg-ivory/95 text-warm-black shadow-[0_8px_22px_rgba(40,30,18,0.18)] transition hover:bg-warm-black hover:text-ivory max-[520px]:h-9 max-[520px]:w-9"
                  aria-label={lang === "it" ? "Elemento successivo" : "Next item"}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}
          </div>

          {views.length > 1 && (
            <div
              className="relative flex items-start justify-center gap-8 px-6 max-[520px]:gap-5 max-[520px]:px-2"
              role="tablist"
              aria-label={lang === "it" ? "Articoli della collection" : "Collection items"}
            >
              <div className="pointer-events-none absolute left-12 right-12 top-[34px] h-px bg-gold/30 max-[520px]:top-[28px]" />
              {views.map((item) => {
                const isActive = item.id === view.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(item)}
                    className="group relative z-[1] flex flex-col items-center gap-2.5"
                    aria-label={(lang === "it" ? "Mostra " : "Show ") + item.title}
                  >
                    <span
                      className={
                        "overflow-hidden rounded-full bg-ivory transition-all duration-300 " +
                        (isActive
                          ? "h-[76px] w-[76px] ring-2 ring-gold shadow-[0_12px_26px_rgba(40,30,18,0.2)] max-[520px]:h-[60px] max-[520px]:w-[60px]"
                          : "h-[60px] w-[60px] ring-1 ring-hairline opacity-80 group-hover:opacity-100 group-hover:ring-warm-black/40 max-[520px]:h-[50px] max-[520px]:w-[50px]")
                      }
                    >
                      <CollectionImage card={item} variant="thumb" />
                    </span>
                    <span className={"font-sans text-[10px] uppercase tracking-[0.16em] " + (isActive ? "text-gold" : "text-taupe")}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonna destra: info collezione / elemento attivo */}
        <div className="flex flex-col items-center justify-center border-l border-hairline px-12 py-14 text-center text-warm-black max-[860px]:border-l-0 max-[860px]:border-t max-[860px]:px-8 max-[860px]:py-10 max-[520px]:px-6 max-[520px]:py-8">
          <Ornament />
          <span className="mt-5 font-sans text-[11px] uppercase tracking-[0.3em] text-taupe">
            {lang === "it" ? "Collezione" : "Collection"}
          </span>
          <h3 id="vtx-preview-title" className="m-0 mt-3 font-serif text-[clamp(30px,4vw,52px)] font-normal leading-[1.05]">
            {view.title}
          </h3>
          <div className="my-6 h-px w-12 bg-gold/50" />
          {shouldShowDescription(view) && (
            <p className="max-w-[330px] font-sans text-[14px] leading-[1.8] text-taupe">
              {view.description}
            </p>
          )}
          {showCta && (
            <button
              type="button"
              onClick={onClose}
              className="mt-9 rounded-[2px] bg-gold px-8 py-3.5 font-sans text-[12px] uppercase tracking-[0.18em] text-warm-white transition hover:bg-warm-black"
            >
              {ctaText}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function VtxCatalogueSection({ config, lang, catalogueData = null }: Props) {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<CollectionRow | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);
  const [detailCollection, setDetailCollection] = useState<CollectionRow | null>(null);
  const [gridLoading, setGridLoading] = useState(true);
  const [displayedCards, setDisplayedCards] = useState<CollectionRow[]>([]);
  const [revealToken, setRevealToken] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const preloadTokenRef = useRef(0);
  const otherScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollOtherLeft, setCanScrollOtherLeft] = useState(false);
  const [canScrollOtherRight, setCanScrollOtherRight] = useState(true);

  const updateOtherScrollButtons = () => {
    const el = otherScrollRef.current;
    if (!el) return;
    setCanScrollOtherLeft(el.scrollLeft > 8);
    setCanScrollOtherRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scrollOtherBy = (direction: "left" | "right") => {
    const el = otherScrollRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *") as HTMLElement | null;
    const cardWidth = card?.offsetWidth ?? el.clientWidth;
    const gap = 16;
    const amount = direction === "left" ? -(cardWidth + gap) : cardWidth + gap;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };
  const { collections, loading } = useCollections(lang);
  const selectedItems = catalogueData?.items ? normalizeSelectedItems(catalogueData.items) : null;
  const allItems = selectedItems ?? collections;

  const openPreview = (head: CollectionRow, viewItem: CollectionRow) => {
    setSelected(head);
    setSelectedViewId(viewItem.id);
  };

  const closePreview = () => {
    setSelected(null);
    setSelectedViewId(null);
  };

  const categories = useMemo<Array<{ key: string; label: string }>>(() => {
    if (selectedItems) {
      const keys = Array.from(new Set(selectedItems.map((item) => item.category).filter(Boolean))) as string[];
      return [
        { key: "all", label: ALL_LABEL[lang] },
        ...keys.sort((a, b) => a.localeCompare(b, lang === "it" ? "it" : "en")).map((cat) => ({
          key: cat,
          label: CATEGORY_LABELS[cat]?.[lang] ?? cat,
        })),
      ];
    }

    const visible = config.show_filters ? config.visible_categories : [];
    return [
      { key: "all", label: ALL_LABEL[lang] },
      ...visible.map((cat) => ({
        key: cat,
        label: CATEGORY_LABELS[cat]?.[lang] ?? cat,
      })),
    ];
  }, [config.show_filters, config.visible_categories, lang, selectedItems]);

  const safeTab = tab >= 0 && tab < categories.length ? tab : 0;
  const activeKey = categories[safeTab]?.key ?? "all";

  const filtered = useMemo(() => {
    return getGridItems(selectedItems ?? collections, activeKey, config.items_limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, activeKey, config.items_limit, selectedItems]);

  useEffect(() => {
    const defaultTab = config.default_tab >= 0 && config.default_tab < categories.length ? config.default_tab : 0;
    if (tab !== defaultTab && tab >= categories.length) setTab(defaultTab);
  }, [categories.length, config.default_tab, tab]);

  useEffect(() => {
    if (loading) {
      setGridLoading(true);
      setDisplayedCards([]);
      return;
    }

    let cancelled = false;
    const token = ++preloadTokenRef.current;

    const run = async () => {
      setGridLoading(true);

      if (filtered.length === 0) {
        if (!cancelled && preloadTokenRef.current === token) {
          setDisplayedCards([]);
          setGridLoading(false);
          setRevealToken((value) => value + 1);
        }
        return;
      }

      const sources = filtered
        .flatMap((card) => {
          const own = getThumbnailImageUrl(card.img_path);
          if (activeKey !== "all" || !isCollection(card)) return own ? [own] : [];

          return [
            own,
            ...getCollectionElements(card, selectedItems ?? collections)
              .slice(0, 4)
              .map((item) => getThumbnailImageUrl(item.img_path)),
          ];
        })
        .filter((src): src is string => Boolean(src));

      if (sources.length > 0) {
        await Promise.all(sources.map((src) => preloadImage(src)));
      }

      if (!cancelled && preloadTokenRef.current === token) {
        setDisplayedCards(filtered);
        setGridLoading(false);
        setRevealToken((value) => value + 1);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [filtered, loading, activeKey, collections, selectedItems]);

  if (!config.enabled) return null;

  const shouldShowSkeleton = loading || gridLoading;
  const isEmptyMock = !loading && !gridLoading && (selectedItems ?? collections).length === 0;

  return (
    <section id="collections" className="bg-ivory py-16 lg:py-[112px] max-[640px]:py-14">
      <div className={BOXED_CONTAINER}>
        <Reveal className="mb-10 flex items-end justify-between gap-10 max-[640px]:mb-8">
          {isEmptyMock ? (
            <CatalogueHeaderSkeleton />
          ) : (
            <div className="max-w-[640px]">
              <div className="flex items-center gap-3.5 mb-6">
                <GoldLine />
                <span className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase text-gold">
                  {config.eyebrow[lang]}
                </span>
              </div>

              <WireReveal className="font-serif font-normal text-[clamp(24px,5vw,64px)] leading-[1.02] tracking-[-0.005em] text-balance mt-4 mb-4">
                {config.title_pre[lang]} <em className="italic text-gold">{config.title_em[lang]}</em>
              </WireReveal>
              <p className="m-0 max-w-[500px] text-[15.5px] leading-[1.7] text-taupe max-[640px]:text-[14px]">
                {config.lede[lang]}
              </p>
            </div>
          )}
        </Reveal>

        {config.show_filters && categories.length > 1 && (
          <div className="mb-10 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading || isEmptyMock ? (
              <div className="flex justify-start">
                <CatalogueTabsSkeleton />
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-max">
                {categories.map((cat, i) => (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={i === safeTab}
                    onClick={() => {
                      setGridLoading(true);
                      setTab(i);
                    }}
                    className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-5 py-2.5 text-[11.5px] uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-200 ${
                      i === safeTab
                        ? "bg-warm-black text-warm-white border-warm-black"
                        : "bg-transparent text-taupe border-hairline hover:text-warm-black hover:border-warm-black"
                    }`}
                  >
                    {cat.label}
                    {i > 0 && (
                      <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${i === safeTab ? "bg-white/15 text-gold-light" : "bg-gold/18 text-gold"}`}>
                        {collections.filter((c) => c.category === cat.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={gridRef}>
          {shouldShowSkeleton || isEmptyMock ? (
            <div className="min-h-[320px]">
              <CatalogueSkeleton count={isEmptyMock ? 4 : 6} />
            </div>
          ) : displayedCards.length === 0 ? (
            <p className="text-center text-taupe py-20 font-serif italic text-[22px]">
              {lang === "it" ? "Nessuna collezione disponibile." : "No collections available."}
            </p>
          ) : activeKey === "all" ? (
            (() => {
              const collectionCards = displayedCards.filter(isCollection);
              const otherCards = displayedCards.filter(card => !isCollection(card));
              const showStandaloneItems = config.show_filters;

              if (collectionCards.length === 0) {
                return (
                  <div className="grid grid-cols-4 gap-x-4 gap-y-7 max-[1100px]:grid-cols-3 max-[768px]:grid-cols-2 max-[420px]:grid-cols-1">
                    {displayedCards.map((card, i) => (
                      <GridCard key={`${card.id}-${revealToken}`} card={card} i={i} config={config} lang={lang} onOpen={openPreview} />
                    ))}
                  </div>
                );
              }

              return (
                <>
                  <div className="flex flex-col gap-4 max-[900px]:gap-3 max-[640px]:gap-2.5">
                    {collectionCards.map((card, i) => (
                      <motion.div
                        key={`${card.id}-${revealToken}`}
                        initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: Math.min(i * 0.07, 0.5), duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                      >
                        <CollectionBlock
                          head={card}
                          allItems={allItems}
                          lang={lang}
                          ctaLabel={lang === "it" ? "Richiedi informazioni" : "Request information"}
                          showRefBadge={config.show_ref_badge}
                          onOpen={openPreview}
                          reverse={i % 2 === 1}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {showStandaloneItems && otherCards.length > 0 && (
                    <div className="relative mt-10">
                      {/* Header: titolo + frecce */}
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="font-serif italic text-[20px] tracking-tight text-warm-black">
                          {lang === "it" ? "Altri articoli" : "Also available"}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => scrollOtherBy("left")}
                            disabled={!canScrollOtherLeft}
                            className="flex size-9 items-center justify-center rounded-full border border-hairline text-taupe transition-all duration-200 hover:border-warm-black hover:text-warm-black disabled:opacity-25 disabled:cursor-not-allowed"
                            aria-label={lang === "it" ? "Scorri a sinistra" : "Scroll left"}
                          >
                            <span className="block leading-none rotate-180"><Arrow size={12} /></span>
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollOtherBy("right")}
                            disabled={!canScrollOtherRight}
                            className="flex size-9 items-center justify-center rounded-full border border-hairline text-taupe transition-all duration-200 hover:border-warm-black hover:text-warm-black disabled:opacity-25 disabled:cursor-not-allowed"
                            aria-label={lang === "it" ? "Scorri a destra" : "Scroll right"}
                          >
                            <Arrow size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Scroll container */}
                      <div
                        ref={otherScrollRef}
                        onScroll={updateOtherScrollButtons}
                        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        style={{ WebkitOverflowScrolling: "touch" }}
                      >
                        {otherCards.map((card, i) => (
                          <div
                            key={`${card.id}-${revealToken}`}
                            className="snap-start shrink-0 w-[calc(25%-12px)] max-[1100px]:w-[calc(33.33%-10.67px)] max-[768px]:w-[calc(50%-8px)] max-[420px]:w-full"
                          >
                            <GridCard card={card} i={i} config={config} lang={lang} onOpen={openPreview} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            /* Altri tab: griglia card standard 4 colonne */
            <div className="grid grid-cols-4 gap-x-4 gap-y-7 max-[1100px]:grid-cols-3 max-[768px]:grid-cols-2 max-[420px]:grid-cols-1">
              {displayedCards.map((card, i) => (
                <GridCard key={`${card.id}-${revealToken}`} card={card} i={i} config={config} lang={lang} onOpen={openPreview} />
              ))}
            </div>
          )}
        </div>
      </div>

      <PreviewModal
        card={selected}
        allItems={allItems}
        initialViewId={selectedViewId}
        lang={lang}
        ctaLabel={config.cta_label[lang]}
        showCta={config.show_cta}
        onClose={closePreview}
      />

      {detailCollection && (
        <CollectionDetailModal
          head={detailCollection}
          elements={getCollectionElements(detailCollection, allItems)}
          config={config}
          lang={lang}
          onClose={() => setDetailCollection(null)}
          onOpenItem={(item) => {
            setDetailCollection(null);
            openPreview(detailCollection, item);
          }}
        />
      )}
    </section>
  );
}

export const VtxCollectionSection = VtxCatalogueSection;
