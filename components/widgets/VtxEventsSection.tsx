"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Arrow } from "@/components/Brand";
import { Reveal } from "@/components/ui/Reveal";
import { GoldLine } from "@/components/ui/GoldLine";
import { WireReveal } from "@/components/ui/WireReveal";
import { FrontendLoader } from "@/components/ui/FrontendLoader";
import type { Lang } from "@/lib/content";
import { useNews, type NewsRow } from "@/lib/useSupabase";
import { getCoverImageUrl, getThumbnailImageUrl, preloadImage } from "@/lib/vitrix/image";
import type { VtxEventsConfig } from "@/lib/vitrix/types";

const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";

const copy = {
  it: {
    eyebrow: "News & Fiere",
    titlePre: "Appuntamenti,",
    titleEm: "fiere e novità.",
    lede:
      "Una selezione essenziale di fiere, appuntamenti e aggiornamenti dal laboratorio RGR.",
    featured: "In evidenza",
    readMore: "Leggi",
    empty: "Nessun articolo disponibile.",
    loading: "Caricamento news",
  },
  en: {
    eyebrow: "News & Fairs",
    titlePre: "Events,",
    titleEm: "fairs and updates.",
    lede:
      "A concise selection of fairs, events and updates from the RGR workshop.",
    featured: "Featured",
    readMore: "Read",
    empty: "No articles available.",
    loading: "Loading news",
  },
} as const;

const coverOf = (item: NewsRow) => item.main_image_url ?? item.cover_image ?? item.main_image_path ?? null;
const dateOf = (item: NewsRow) => item.event_date_label ?? item.event_date ?? "";
const excerptOf = (item: NewsRow) => item.excerpt ?? item.description ?? "";
const hrefOf = (item: NewsRow) => (item.slug ? `/events/${item.type}/${item.slug}` : null);
const typeLabel = (item: NewsRow) => item.category || item.type;

function uniqueById(items: NewsRow[]) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function EventCardLink({
  item,
  children,
  className,
}: {
  item: NewsRow;
  children: ReactNode;
  className: string;
}) {
  const href = hrefOf(item);
  if (!href) {
    return (
      <div className={`${className} cursor-default opacity-90`} aria-disabled="true">
        {children}
      </div>
    );
  }

  return (
    <Link href={href} title={`${item.title} - RGR Handmade`} className={className}>
      {children}
    </Link>
  );
}

function EventImage({
  src,
  alt,
  variant = "thumb",
  position,
}: {
  src: string | null;
  alt: string;
  variant?: "thumb" | "cover";
  position?: string | null;
}) {
  const url = variant === "cover" ? getCoverImageUrl(src) : getThumbnailImageUrl(src);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F1ECE3]" aria-hidden="true">
        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-warm-black/28">
          RGR
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className="h-full w-full object-cover"
      style={{ objectPosition: position || "center" }}
      loading={variant === "cover" ? "eager" : "lazy"}
      fetchPriority={variant === "cover" ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function NewsCard({ item, lang, featured = false }: { item: NewsRow; lang: Lang; featured?: boolean }) {
  const t = copy[lang];
  const hasMeta = dateOf(item) || item.venue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className={featured ? "lg:col-span-2" : ""}
    >
      <EventCardLink
        item={item}
        className={[
          "group grid h-full overflow-hidden border border-gold/24 bg-warm-white shadow-[0_20px_64px_rgba(61,44,27,0.08)] transition-transform duration-300 hover:-translate-y-1",
          featured ? "grid-cols-[1.1fr_0.9fr] max-[860px]:grid-cols-1" : "grid-rows-[auto_1fr]",
        ].join(" ")}
      >
        <div className={`overflow-hidden bg-[#F1ECE3] ${featured ? "min-h-[360px] max-[860px]:min-h-0 max-[860px]:aspect-[16/10]" : "aspect-[16/10]"}`}>
          <div className="h-full w-full transition-transform duration-[1000ms] ease-out group-hover:scale-[1.035]">
            <EventImage src={coverOf(item)} alt={item.title} variant={featured ? "cover" : "thumb"} position={item.image_position} />
          </div>
        </div>

        <div className={`flex flex-col ${featured ? "justify-center p-10 max-[640px]:p-6" : "p-6"}`}>
          <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            {featured ? t.featured : typeLabel(item)}
          </p>
          <h3 className={`font-serif leading-[1.05] text-warm-black transition-colors duration-200 group-hover:text-gold-deep ${featured ? "text-[clamp(34px,4vw,52px)]" : "text-[28px]"}`}>
            {item.title}
          </h3>
          {hasMeta && (
            <div className="mt-3 grid gap-1 font-serif text-[14px] italic text-taupe">
              {dateOf(item) && <span>{dateOf(item)}</span>}
              {item.venue && <span>{item.venue}</span>}
            </div>
          )}
          {excerptOf(item) && (
            <p className={`mt-5 font-sans text-[13.5px] leading-[1.65] text-warm-black/66 ${featured ? "max-w-[46ch]" : "line-clamp-3"}`}>
              {excerptOf(item)}
            </p>
          )}
          <span className="mt-6 inline-flex w-fit items-center gap-3 border border-gold/45 px-4 py-2.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold transition-colors duration-200 group-hover:bg-gold group-hover:text-warm-white">
            {t.readMore}
            <Arrow size={11} />
          </span>
        </div>
      </EventCardLink>
    </motion.div>
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
  const preloadTokenRef = useRef(0);

  const items = useMemo(() => {
    const ordered = config.featured_first
      ? uniqueById([...displayed.filter((item) => item.is_featured), ...displayed])
      : displayed;
    return ordered.slice(0, config.items_limit || 6);
  }, [config.featured_first, config.items_limit, displayed]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const token = ++preloadTokenRef.current;

    const run = async () => {
      setGridLoading(true);
      const sources = news
        .slice(0, 6)
        .map((item, index) => (index === 0 ? getCoverImageUrl(coverOf(item)) : getThumbnailImageUrl(coverOf(item))))
        .filter((source): source is string => Boolean(source));
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
  }, [news, loading]);

  if (!config.enabled) return null;

  const t = copy[lang];
  const showSkeleton = loading || gridLoading;
  const [featured, ...rest] = items;

  return (
    <section id={config.section_id || "news"} className="bg-[linear-gradient(180deg,#fbf7ef_0%,#f3eadc_100%)] py-24 text-warm-black max-[640px]:py-16">
      <div className={BOXED_CONTAINER}>
        <div className="grid grid-cols-[0.75fr_1.25fr] gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-8">
          <Reveal>
            <div className="mb-6 flex items-center gap-3.5">
              <GoldLine />
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {t.eyebrow}
              </span>
            </div>
            <WireReveal className="font-serif text-[clamp(38px,5.4vw,76px)] leading-[0.98] text-warm-black">
              {t.titlePre} <em className="italic text-gold-deep">{t.titleEm}</em>
            </WireReveal>
          </Reveal>

          <Reveal delay={0.1} className="flex items-end">
            <p className="m-0 max-w-[620px] font-serif text-[22px] leading-[1.45] text-warm-black/68 max-[640px]:text-[18px]">
              {t.lede}
            </p>
          </Reveal>
        </div>

        {showSkeleton ? (
          <div className="flex min-h-[360px] items-center justify-center px-6">
            <FrontendLoader label={t.loading} />
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center font-serif text-[24px] italic text-taupe">{t.empty}</p>
        ) : (
          <div className="mt-14 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-[700px]:grid-cols-1">
            {featured && <NewsCard item={featured} lang={lang} featured />}
            {rest.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
