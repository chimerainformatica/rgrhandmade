import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getPreviewImageUrl } from "@/lib/vitrix/image";
import { getSiteSettings } from "@/lib/vitrix/settings";
import { PageChrome } from "@/components/PageChrome";
import type { VtxEventRow } from "@/lib/vitrix/types";

const VALID_TYPES = new Set(["event", "fiera", "press"]);

type Props = { params: Promise<{ type: string; slug: string }> };

async function getEvent(type: string, slug: string): Promise<VtxEventRow | null> {
  if (!VALID_TYPES.has(type)) return null;
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("type", type)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as VtxEventRow;
}

const coverOf = (e: VtxEventRow) => e.main_image_url ?? e.cover_image ?? e.main_image_path ?? null;
const dateOf = (e: VtxEventRow) => e.event_date_label ?? e.event_date ?? "";
const bodyOf = (e: VtxEventRow) => e.content ?? e.body ?? e.excerpt ?? e.description ?? "";

function absoluteUrl(value: string | null | undefined, base: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, base).toString();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, slug } = await params;
  const e = await getEvent(type, slug);
  if (!e) return { title: "Contenuto non trovato — RGR Handmade" };

  const settings = await getSiteSettings();
  const description = e.seo_description ?? e.excerpt ?? e.description ?? undefined;
  const canonical = absoluteUrl(e.canonical_url, settings.canonical_url) ?? new URL(`/events/${type}/${slug}`, settings.canonical_url).toString();
  const ogSource = e.og_image_url ?? e.og_image_path ?? coverOf(e);
  const ogImage = absoluteUrl(getPreviewImageUrl(ogSource) ?? ogSource, settings.canonical_url);

  return {
    title: e.seo_title ?? `${e.title} — RGR Handmade`,
    description,
    alternates: { canonical },
    robots: {
      index: e.robots_index ?? true,
      follow: e.robots_follow ?? true,
    },
    openGraph: {
      title: e.seo_title ?? e.title,
      description,
      type: "article",
      url: canonical,
      siteName: settings.site_name,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { type, slug } = await params;
  const event = await getEvent(type, slug);
  if (!event) notFound();

  const cover = getPreviewImageUrl(coverOf(event));
  const date = dateOf(event);
  const paragraphs = bodyOf(event)
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const tags = event.tags ?? [];

  return (
    <main className="min-h-screen bg-ivory text-warm-black">
      <PageChrome initialLang={(event.lang as "it" | "en") ?? "it"} />

      {/* HERO sobrio — fascia compatta, non invasiva */}
      <section className="pt-[140px] pb-12 max-[640px]:pt-28 max-[640px]:pb-8 border-b border-hairline/70 bg-[linear-gradient(180deg,#F8F2E8_0%,#F1E9DB_100%)]">
        <div className="max-w-[860px] mx-auto px-8 max-[640px]:px-4">
          <nav className="font-sans text-[11px] tracking-[0.12em] uppercase text-taupe mb-6">
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/#news" className="hover:text-gold transition-colors">News</Link>
            <span className="mx-2">/</span>
            <span className="text-warm-black/70">{event.category}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="font-sans text-[10.5px] font-semibold tracking-[0.22em] uppercase px-3 py-1 rounded-full bg-gold/14 text-gold border border-gold/30">
              {event.category}
            </span>
            {event.venue && (
              <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-taupe">{event.venue}</span>
            )}
            {date && <span className="font-serif italic text-[16px] text-taupe ml-auto">{date}</span>}
          </div>

          <h1 className="font-serif font-normal text-[clamp(30px,5vw,52px)] leading-[1.05] text-warm-black text-balance">
            {event.title}
          </h1>

          {(event.excerpt || event.description) && (
            <p className="mt-5 font-sans text-[16px] leading-[1.75] text-warm-black/65 max-w-[60ch]">
              {event.excerpt ?? event.description}
            </p>
          )}
        </div>
      </section>

      {/* CORPO */}
      <article className="py-14 max-[640px]:py-10">
        <div className="max-w-[860px] mx-auto px-8 max-[640px]:px-4">
          {cover && (
            <figure className="mb-12 overflow-hidden rounded-[6px] border border-hairline bg-[#F0EDE8] shadow-[0_20px_44px_rgba(61,44,27,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={event.image_alt || event.title}
                className="w-full block object-cover"
                style={{ objectPosition: event.image_position || "center" }}
                loading="eager"
                decoding="async"
              />
            </figure>
          )}

          <div className="prose-event max-w-[68ch] mx-auto">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <p key={i} className="font-sans text-[16.5px] leading-[1.8] text-warm-black/80 mb-6">
                  {p}
                </p>
              ))
            ) : (
              <p className="font-serif italic text-[20px] text-taupe text-center">
                Contenuto in aggiornamento.
              </p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 max-w-[68ch] mx-auto">
              {tags.map((tag) => (
                <span key={tag} className="font-sans text-[12px] px-3 py-1 rounded-full bg-warm-white border border-hairline text-taupe">
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
                className="inline-flex items-center gap-3 px-8 py-4 font-sans text-[12.5px] font-medium tracking-[0.16em] uppercase rounded-full border border-gold text-warm-black hover:bg-gold hover:text-warm-white transition-all duration-300"
              >
                {event.cta_label}
              </a>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-hairline text-center">
            <Link href="/#news" className="inline-flex items-center gap-2 font-sans text-[12.5px] font-medium tracking-[0.14em] uppercase text-gold hover:text-gold-deep transition-colors">
              ← {event.lang === "en" ? "Back to news" : "Torna alle news"}
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
