"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import type { Lang } from "@/lib/content";
import { useNews, type NewsRow } from "@/lib/useSupabase";
import { getCoverImageUrl, getThumbnailImageUrl, getZoomImageUrl, preloadImage } from "@/lib/vitrix/image";
import type { VtxEventsConfig } from "@/lib/vitrix/types";

const BOXED_CONTAINER = "max-w-[1280px] mx-auto px-8 max-[640px]:px-4";

const copy = {
  it: {
    titlePre: "Appuntamenti,",
    titleEm: "fiere e novita.",
    lede: "Una selezione essenziale di fiere, appuntamenti e aggiornamenti dal laboratorio RGR.",
    readMore: "Leggi",
    empty: "Nessun articolo disponibile.",
    loading: "Caricamento news",
  },
  en: {
    titlePre: "Events,",
    titleEm: "fairs and updates.",
    lede: "A concise selection of fairs, events and updates from the RGR workshop.",
    readMore: "Read",
    empty: "No articles available.",
    loading: "Loading news",
  },
} as const;

const coverOf = (item: NewsRow) => item.main_image_url ?? item.cover_image ?? item.main_image_path ?? null;
const dateOf = (item: NewsRow) => item.event_date_label ?? item.event_date ?? "";
const excerptOf = (item: NewsRow) => item.excerpt ?? item.description ?? "";
const VALID_EVENT_TYPES = new Set(["event", "fiera", "press"]);

function isValidEventType(type: string | null | undefined): type is "event" | "fiera" | "press" {
  return Boolean(type && VALID_EVENT_TYPES.has(type));
}

const hrefOf = (item: NewsRow, lang: Lang) => {
  if (!item.slug || !isValidEventType(item.type)) return null;
  return `/events/${item.type}/${encodeURIComponent(item.slug)}?lang=${lang}`;
};

function shouldBypassNextOptimization(src: string): boolean {
  return src.startsWith("http") && !src.includes("mzxsbwoeupzctfrtaemd.supabase.co");
}

function uniqueById(items: NewsRow[]) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function EventImage({
  src,
  alt,
  position,
  priority = false,
  format = "cover",
}: {
  src: string | null;
  alt: string;
  position?: string | null;
  priority?: boolean;
  format?: "cover" | "thumbnail";
}) {
  const url = format === "thumbnail" ? getThumbnailImageUrl(src) : getCoverImageUrl(src);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F1ECE3]" aria-hidden="true">
        <span className="font-sans text-[10px] uppercase text-warm-black/28">
          RGR
        </span>
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover"
      style={{ objectPosition: position || "center" }}
      priority={priority}
      unoptimized={shouldBypassNextOptimization(url)}
      onError={() => setFailed(true)}
    />
  );
}

function Ornament() {
  return (
    <div className="mx-auto mt-7 flex items-center justify-center gap-3 text-gold" aria-hidden="true">
      <span className="h-px w-16 bg-gold/45 max-[520px]:w-10" />
      <span className="size-2 rotate-45 border border-gold/70 bg-ivory" />
      <span className="h-px w-16 bg-gold/45 max-[520px]:w-10" />
    </div>
  );
}

function MiniSeal() {
  return (
    <span
      className="absolute left-1/2 top-0 z-10 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/45 bg-warm-white text-gold shadow-[0_8px_22px_rgba(61,44,27,0.10)]"
      aria-hidden="true"
    >
      <span className="font-serif text-[14px] font-medium">RGR</span>
    </span>
  );
}

function EventCardsSkeleton() {
  return (
    <>
      <div className="mt-14 flex gap-6 overflow-hidden pb-7">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="shrink-0 basis-[calc((100%_-_48px)/3)] overflow-hidden border border-[#d8c8b4] bg-warm-white shadow-[0_22px_54px_rgba(48,35,24,0.10)] max-[1024px]:basis-[calc((100%_-_24px)/2)] max-[680px]:basis-full"
          >
            <div className="aspect-[16/10] skeleton" />
            <div className="relative flex min-h-[330px] flex-col items-center px-9 pb-8 pt-12 max-[680px]:min-h-[280px] max-[680px]:px-6">
              <span className="absolute left-1/2 top-0 z-10 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full skeleton" />
              <div className="h-8 w-2/3 rounded skeleton" />
              <div className="mt-4 h-3 w-3 rounded-sm skeleton" />
              <div className="mt-5 h-4 w-36 rounded skeleton" />
              <div className="mt-8 h-4 w-full rounded skeleton" />
              <div className="mt-3 h-4 w-4/5 rounded skeleton" />
              <div className="mt-auto h-11 w-36 skeleton" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-center gap-5">
        <div className="size-14 rounded-full skeleton" />
        <div className="size-14 rounded-full skeleton" />
      </div>
    </>
  );
}

type ImagePreview = {
  src: string;
  alt: string;
};

function NewsCard({
  item,
  index,
  ctaLabel,
  lang,
}: {
  item: NewsRow;
  index: number;
  ctaLabel: string;
  lang: Lang;
}) {
  const date = dateOf(item);
  const excerpt = excerptOf(item);
  const href = hrefOf(item, lang);
  const alt = item.image_alt || item.title;

  const cardContent = (
    <>
      <MiniSeal />
      <h3 className="font-serif text-[32px] font-medium leading-[1.03] text-warm-black transition-colors duration-200 group-hover:text-gold max-[680px]:text-[29px]">
        {item.title}
      </h3>
      <span className="mt-3 size-1.5 rotate-45 border border-gold/65" aria-hidden="true" />
      {(date || item.venue) && (
        <div className="mt-4 grid gap-1 font-sans text-[13px] font-medium leading-[1.45] text-taupe">
          {date && <span>{date}</span>}
          {item.venue && <span>{item.venue}</span>}
        </div>
      )}
      {excerpt && (
        <p className="mx-auto mt-5 line-clamp-3 max-w-[34ch] font-sans text-[13.5px] leading-[1.75] text-warm-black/72">
          {excerpt}
        </p>
      )}
      <span className="mt-auto inline-flex min-h-11 items-center gap-5 border border-gold/60 px-8 py-3 font-sans text-[11px] font-semibold uppercase text-gold transition-colors duration-200 group-hover:bg-gold group-hover:text-warm-white max-[360px]:px-5">
        {ctaLabel}
        <ChevronRight size={14} strokeWidth={1.5} />
      </span>
    </>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: Math.min(index * 0.06, 0.24), duration: 0.58, ease: [0.2, 0.7, 0.2, 1] }}
      className="group flex h-full snap-start shrink-0 basis-[calc((100%_-_48px)/3)] flex-col overflow-hidden border border-[#d8c8b4] bg-warm-white text-center shadow-[0_22px_54px_rgba(48,35,24,0.16)] transition-transform duration-300 hover:-translate-y-1 max-[1024px]:basis-[calc((100%_-_24px)/2)] max-[680px]:basis-full"
    >
      {href ? <Link href={href} aria-label={`${item.title} - RGR Handmade`} className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#F1ECE3] text-left">
        <div className="relative h-full w-full transition-transform duration-[1000ms] ease-out group-hover:scale-[1.035]">
          <EventImage src={coverOf(item)} alt={alt} position={item.image_position} priority={index === 0} format="cover" />
        </div>
      </Link> : <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#F1ECE3]">
        <EventImage src={coverOf(item)} alt={alt} position={item.image_position} priority={index === 0} format="cover" />
      </div>}

      {href ? (
        <Link href={href} title={`${item.title} - RGR Handmade`} className="relative flex min-h-[330px] flex-1 flex-col items-center px-9 pb-8 pt-12 max-[680px]:min-h-[300px] max-[680px]:px-6 max-[680px]:pb-7">
          {cardContent}
        </Link>
      ) : (
        <div className="relative flex min-h-[330px] flex-1 cursor-default flex-col items-center px-9 pb-8 pt-12 opacity-90 max-[680px]:min-h-[300px] max-[680px]:px-6 max-[680px]:pb-7" aria-disabled="true">
          {cardContent}
        </div>
      )}
    </motion.article>
  );
}

function PublicationCardsSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-4 gap-x-6 gap-y-10 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index}>
          <div className="aspect-[3/4] skeleton bg-white/10" />
          <div className="mt-5 h-6 w-4/5 skeleton bg-white/10" />
          <div className="mt-3 h-3 w-2/5 skeleton bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function PublicationCard({ item, index, lang, onPreview }: { item: NewsRow; index: number; lang: Lang; onPreview: (preview: ImagePreview, trigger: HTMLButtonElement) => void }) {
  const zoomUrl = getZoomImageUrl(coverOf(item));
  const alt = item.image_alt || item.title;
  const edition = dateOf(item);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: Math.min(index * 0.055, 0.22), duration: 0.5 }}
      className="group"
    >
      <button
        type="button"
        disabled={!zoomUrl}
        onClick={(event) => zoomUrl && onPreview({ src: zoomUrl, alt }, event.currentTarget)}
        className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden border border-white/15 bg-[#29241f] text-left shadow-[0_24px_60px_rgba(0,0,0,0.34)] transition-transform duration-300 hover:-translate-y-1 disabled:cursor-default"
        aria-label={zoomUrl ? `${lang === "it" ? "Apri copertina" : "Open cover"}: ${alt}` : undefined}
      >
        <div className="relative h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.025]">
          <EventImage src={coverOf(item)} alt={alt} position={item.image_position} priority={index < 2} format="thumbnail" />
        </div>
        {zoomUrl && <span className="absolute bottom-3 right-3 border border-white/30 bg-black/60 px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">{lang === "it" ? "Sfoglia" : "View"}</span>}
      </button>
      <div className="pt-5">
        {edition && <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light/75">{edition}</p>}
        <h3 className="mt-2 font-serif text-[25px] font-normal leading-tight text-ivory">{item.title}</h3>
      </div>
    </motion.article>
  );
}

interface Props {
  config: VtxEventsConfig;
  lang: Lang;
}

export function VtxEventsSection({ config, lang }: Props) {
  const { news, loading } = useNews(lang);
  const [displayed, setDisplayed] = useState<NewsRow[]>([]);
  const [gridLoading, setGridLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const preloadTokenRef = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);

  const orderedItems = useMemo(() => config.featured_first
    ? uniqueById([...displayed.filter((item) => item.is_featured), ...displayed])
    : displayed, [config.featured_first, displayed]);
  const eventItems = useMemo(() => orderedItems.filter((item) => item.type !== "publication").slice(0, config.items_limit || 6), [config.items_limit, orderedItems]);
  const publicationItems = useMemo(() => orderedItems.filter((item) => item.type === "publication").slice(0, config.publications.items_limit || 8), [config.publications.items_limit, orderedItems]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const token = ++preloadTokenRef.current;

    const run = async () => {
      setGridLoading(true);
      const sources = [
        ...news.filter((item) => item.type !== "publication").slice(0, config.items_limit || 6).map((item) => getCoverImageUrl(coverOf(item))),
        ...news.filter((item) => item.type === "publication").slice(0, config.publications.items_limit || 8).map((item) => getThumbnailImageUrl(coverOf(item))),
      ].filter((source): source is string => Boolean(source));
      if (sources.length > 0) await Promise.all(sources.map((source) => preloadImage(source)));

      if (!cancelled && preloadTokenRef.current === token) {
        setDisplayed(news);
        setGridLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [config.items_limit, config.publications.items_limit, news, loading]);

  const t = copy[lang];
  const showSkeleton = loading || gridLoading;
  const title = config.title?.[lang] || `${t.titlePre} ${t.titleEm}`;
  const description = config.description?.[lang] || t.lede;
  const ctaLabel = config.cta_label?.[lang] || t.readMore;

  const updateScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  const scrollCarousel = useCallback((direction: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = direction === "next" ? el.clientWidth : -el.clientWidth;
    el.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(updateScrollButtons, 360);
  }, [updateScrollButtons]);

  useEffect(() => {
    if (showSkeleton) return;
    const el = carouselRef.current;
    if (!el) return;

    updateScrollButtons();
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [eventItems.length, showSkeleton, updateScrollButtons]);

  const openImagePreview = useCallback((preview: ImagePreview, trigger: HTMLButtonElement) => {
    previewTriggerRef.current = trigger;
    setImagePreview(preview);
  }, []);

  const closeImagePreview = useCallback(() => setImagePreview(null), []);

  useEffect(() => {
    if (!imagePreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => lightboxCloseRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImagePreview();
      if (event.key === "Tab") {
        event.preventDefault();
        lightboxCloseRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previewTriggerRef.current?.focus();
    };
  }, [closeImagePreview, imagePreview]);

  if (!config.enabled) return null;

  return (
    <>
    <section
      id={config.section_id || "news"}
      className="relative scroll-mt-24 overflow-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(184,146,84,0.10),transparent_26%),linear-gradient(180deg,#fbf7ef_0%,#f1e8da_100%)] py-24 text-warm-black max-[640px]:scroll-mt-20 max-[640px]:py-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(184,146,84,0.22) 1px,transparent 1px),linear-gradient(180deg,rgba(184,146,84,0.18) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
        aria-hidden="true"
      />
      <div className={BOXED_CONTAINER}>
        <div className="relative">
          <Reveal className="mx-auto max-w-[760px] text-center">
            <h2 className="font-serif text-[52px] font-medium uppercase leading-none text-gold max-[680px]:text-[38px] max-[390px]:text-[32px]">
              {title}
            </h2>
            <Ornament />
            <p className="mx-auto mt-8 max-w-[580px] font-sans text-[12px] font-medium uppercase leading-[1.8] text-warm-black/62 max-[520px]:text-[10px]">
              {description}
            </p>
          </Reveal>

          {showSkeleton ? (
            <EventCardsSkeleton />
          ) : eventItems.length === 0 ? (
            <p className="py-20 text-center font-serif text-[24px] italic text-taupe">{t.empty}</p>
          ) : (
            <>
              <div
                ref={carouselRef}
                onScroll={updateScrollButtons}
                className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {eventItems.map((item, index) => (
                  <NewsCard key={item.id} item={item} index={index} ctaLabel={ctaLabel} lang={lang} />
                ))}
              </div>

              <div className="mt-1 flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => scrollCarousel("prev")}
                  disabled={!canScrollLeft}
                  className="grid size-14 min-h-11 min-w-11 place-items-center rounded-full border border-gold/55 bg-transparent text-warm-black transition-all duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={lang === "it" ? "Eventi precedenti" : "Previous events"}
                >
                  <ChevronLeft size={24} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("next")}
                  disabled={!canScrollRight}
                  className="grid size-14 min-h-11 min-w-11 place-items-center rounded-full border border-gold/55 bg-transparent text-warm-black transition-all duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={lang === "it" ? "Eventi successivi" : "Next events"}
                >
                  <ChevronRight size={24} strokeWidth={1.8} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>

      {config.publications.enabled && (showSkeleton || publicationItems.length > 0) && (
        <section id={config.publications.section_id || "publications"} className="relative scroll-mt-24 overflow-hidden bg-[#171411] py-24 text-ivory max-[640px]:scroll-mt-20 max-[640px]:py-16">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(90deg,rgba(216,190,130,0.2) 1px,transparent 1px)", backgroundSize: "96px 100%" }} aria-hidden="true" />
          <div className={BOXED_CONTAINER}>
            <div className="relative">
              <Reveal className="max-w-[720px]">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-light/70">R.G.R. Editorial Archive</p>
                <h2 className="mt-5 font-serif text-[clamp(42px,7vw,76px)] font-normal leading-[0.95] text-ivory">{config.publications.title[lang]}</h2>
                <p className="mt-7 max-w-[620px] font-sans text-[13px] leading-[1.8] text-ivory/62">{config.publications.description[lang]}</p>
              </Reveal>

              {showSkeleton ? <PublicationCardsSkeleton /> : (
                <div className="mt-12 grid grid-cols-4 gap-x-6 gap-y-12 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
                  {publicationItems.map((item, index) => <PublicationCard key={item.id} item={item} index={index} lang={lang} onPreview={openImagePreview} />)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {imagePreview && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "it" ? `Anteprima immagine: ${imagePreview.alt}` : `Image preview: ${imagePreview.alt}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeImagePreview(); }}
          className="fixed inset-0 z-[1600] grid place-items-center bg-warm-black/92 p-4 backdrop-blur-md max-[640px]:p-2"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[min(90vh,960px)] w-[min(92vw,760px)] overflow-hidden border border-warm-white/20 bg-warm-black shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
          >
            <Image
              src={imagePreview.src}
              alt={imagePreview.alt}
              fill
              sizes="92vw"
              className="object-contain"
              unoptimized={shouldBypassNextOptimization(imagePreview.src)}
            />
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={closeImagePreview}
              className="absolute right-3 top-3 grid size-12 place-items-center rounded-full border border-warm-white/35 bg-warm-black/65 text-warm-white backdrop-blur-sm transition-colors hover:border-gold-light hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
              aria-label={lang === "it" ? "Chiudi anteprima immagine" : "Close image preview"}
            >
              <X size={22} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
