import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getCoverImageUrl, getPreviewImageUrl } from "@/lib/vitrix/image";
import { getSiteSettings } from "@/lib/vitrix/settings";
import { PageChrome } from "@/components/PageChrome";
import type { VtxEventRow } from "@/lib/vitrix/types";

const VALID_TYPES = new Set(["event", "fiera", "press"]);
const VALID_LANGS = new Set(["it", "en"]);
const DEFAULT_HERO_IMAGE = "/assets/rgr/news-hero.webp";

type Props = {
  params: Promise<{ type: string; slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

function normalizeLang(lang: string | undefined): "it" | "en" | null {
  return lang && VALID_LANGS.has(lang) ? (lang as "it" | "en") : null;
}

function decodeRouteSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function shouldBypassNextOptimization(src: string): boolean {
  return src.startsWith("http") && !src.includes("mzxsbwoeupzctfrtaemd.supabase.co");
}

async function getEvent(type: string, slug: string, lang?: string | null): Promise<VtxEventRow | null> {
  if (!VALID_TYPES.has(type)) return null;
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return null;

  const supabase = createAdminClient();
  let query = supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("type", type)
    .eq("status", "published");

  if (lang) query = query.eq("lang", lang);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;
  return data as VtxEventRow;
}

const coverOf = (event: VtxEventRow) => event.main_image_url ?? event.cover_image ?? event.main_image_path ?? null;
const dateOf = (event: VtxEventRow) => event.event_date_label ?? event.event_date ?? "";
const bodyOf = (event: VtxEventRow) => event.content ?? event.body ?? event.excerpt ?? event.description ?? "";

function absoluteUrl(value: string | null | undefined, base: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, base).toString();
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { type, slug } = await params;
  const lang = normalizeLang((await searchParams)?.lang);
  const decodedSlug = decodeRouteSlug(slug);
  const event = await getEvent(type, decodedSlug, lang);
  if (!event) return { title: "Contenuto non trovato - RGR Handmade" };

  const settings = await getSiteSettings();
  const description = event.seo_description ?? event.excerpt ?? event.description ?? undefined;
  const canonicalPath = `/events/${type}/${encodeURIComponent(decodedSlug)}${lang ? `?lang=${lang}` : ""}`;
  const canonical = absoluteUrl(event.canonical_url, settings.canonical_url) ?? new URL(canonicalPath, settings.canonical_url).toString();
  const ogSource = event.og_image_url ?? event.og_image_path ?? coverOf(event);
  const ogImage = absoluteUrl(getPreviewImageUrl(ogSource) ?? ogSource, settings.canonical_url);

  return {
    title: event.seo_title ?? `${event.title} - RGR Handmade`,
    description,
    alternates: { canonical },
    robots: {
      index: event.robots_index ?? true,
      follow: event.robots_follow ?? true,
    },
    openGraph: {
      title: event.seo_title ?? event.title,
      description,
      type: "article",
      url: canonical,
      siteName: settings.site_name,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { type, slug } = await params;
  const lang = normalizeLang((await searchParams)?.lang);
  const decodedSlug = decodeRouteSlug(slug);
  const event = await getEvent(type, decodedSlug, lang);
  if (!event) notFound();

  const heroImage = getCoverImageUrl(coverOf(event)) ?? DEFAULT_HERO_IMAGE;
  const date = dateOf(event);
  const paragraphs = bodyOf(event)
    .split(/\n{2,}|\r\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const tags = event.tags ?? [];

  return (
    <main className="min-h-screen bg-ivory text-warm-black">
      <PageChrome initialLang={(event.lang as "it" | "en") ?? "it"} />

      <section className="relative min-h-[620px] overflow-hidden border-b border-hairline-dark bg-warm-black pt-[150px] text-ivory max-[640px]:min-h-[590px] max-[640px]:pt-28 max-[380px]:min-h-[540px]">
        <Image
          src={heroImage}
          alt={event.image_alt || event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: event.image_position || "center" }}
          unoptimized={shouldBypassNextOptimization(heroImage)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,20,17,0.72)_0%,rgba(23,20,17,0.38)_42%,rgba(23,20,17,0.88)_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(216,190,130,0.18),transparent_28%)]" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-[470px] max-w-[980px] flex-col justify-end px-8 pb-16 max-[640px]:min-h-[450px] max-[640px]:px-4 max-[640px]:pb-10 max-[380px]:min-h-[410px]">
          <nav className="mb-7 font-sans text-[11px] uppercase text-ivory/76 max-[640px]:mb-5">
            <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-gold-light">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/#news" className="inline-flex min-h-11 items-center transition-colors hover:text-gold-light">News</Link>
            <span className="mx-2">/</span>
            <span className="text-ivory/88">{event.category}</span>
          </nav>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-8 items-center border border-gold/50 bg-warm-black/30 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase text-gold-light backdrop-blur">
              {event.category}
            </span>
            {event.venue && (
              <span className="font-sans text-[11px] uppercase text-ivory/76">{event.venue}</span>
            )}
            {date && <span className="ml-auto font-serif text-[17px] italic text-ivory/82 max-[640px]:ml-0">{date}</span>}
          </div>

          <h1 className="max-w-[780px] text-balance font-serif text-[clamp(38px,12vw,86px)] font-normal leading-[0.95] text-ivory">
            {event.title}
          </h1>

          {(event.excerpt || event.description) && (
            <p className="mt-6 max-w-[58ch] font-sans text-[16px] leading-[1.75] text-ivory/78 max-[640px]:text-[14.5px]">
              {event.excerpt ?? event.description}
            </p>
          )}
        </div>
      </section>

      <article className="py-14 max-[640px]:py-10">
        <div className="mx-auto max-w-[860px] px-8 max-[640px]:px-4">
          <div className="prose-event mx-auto max-w-[68ch]">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-6 font-sans text-[16.5px] leading-[1.8] text-warm-black/80">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-center font-serif text-[20px] italic text-taupe">
                Contenuto in aggiornamento.
              </p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mx-auto mt-10 flex max-w-[68ch] flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="border border-hairline bg-warm-white px-3 py-1 font-sans text-[12px] text-taupe">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {event.cta_label && event.cta_url && (
            <div className="mt-12 text-center">
              <a
                href={event.cta_url}
                target={event.cta_target || "_self"}
                rel={event.cta_target === "_blank" ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-gold px-8 py-4 font-sans text-[12.5px] font-medium uppercase text-warm-black transition-all duration-300 hover:bg-gold hover:text-warm-white max-[420px]:w-full"
              >
                {event.cta_label}
              </a>
            </div>
          )}

          <div className="mt-16 border-t border-hairline pt-8 text-center">
            <Link href="/#news" className="inline-flex min-h-11 items-center gap-2 font-sans text-[12.5px] font-medium uppercase text-gold transition-colors hover:text-gold-deep">
              {event.lang === "en" ? "Back to news" : "Torna alle news"}
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
