import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { MediaCollection, MediaCollectionItem } from "@/lib/vitrix/types";

type Props = { params: Promise<{ slug: string; itemSlug: string }> };

async function getItemData(collectionSlug: string, itemSlug: string): Promise<{ collection: MediaCollection; item: MediaCollectionItem } | null> {
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return null;

  const supabase = createAdminClient();

  const { data: collection, error: colErr } = await supabase
    .from("media_collections")
    .select("*")
    .eq("slug", collectionSlug)
    .eq("status", "published")
    .single();

  if (colErr || !collection) return null;

  const { data: item, error: itemErr } = await supabase
    .from("media_collection_items")
    .select("*")
    .eq("collection_id", collection.id)
    .eq("slug", itemSlug)
    .eq("status", "published")
    .single();

  if (itemErr || !item) return null;

  return {
    collection: collection as MediaCollection,
    item: item as MediaCollectionItem,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, itemSlug } = await params;
  const data = await getItemData(slug, itemSlug);
  if (!data) return { title: "Elemento non trovato" };
  return {
    title: `${data.item.title} — ${data.collection.name}`,
    description: data.item.description ?? data.item.alt_text ?? undefined,
    openGraph: {
      images: data.item.url ? [{ url: data.item.url }] : undefined,
    },
  };
}

export default async function CollectionItemPage({ params }: Props) {
  const { slug, itemSlug } = await params;
  const data = await getItemData(slug, itemSlug);

  if (!data) notFound();

  const { collection, item } = data;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(184,148,106,0.08), transparent 28%), linear-gradient(180deg, #FBF8F3 0%, #F6F1EA 100%)",
        fontFamily: "var(--font-manrope, sans-serif)",
        color: "#1E1A16",
      }}
    >
      <header style={{ borderBottom: "1px solid rgba(232,228,222,0.9)", padding: "20px 40px", backgroundColor: "rgba(255,255,255,0.68)", backdropFilter: "blur(10px)" }}>
        <nav style={{ fontSize: 12, color: "#9B8F82", letterSpacing: "0.08em", maxWidth: 1100, margin: "0 auto" }}>
          <Link href="/" style={{ color: "#9B8F82", textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href={`/catalogue/${slug}`} style={{ color: "#9B8F82", textDecoration: "none" }}>
            {collection.name}
          </Link>
          {" / "}
          <span style={{ color: "#3A3530" }}>{item.title}</span>
        </nav>
      </header>

      <section style={{ padding: "48px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
            gap: 56,
            alignItems: "start",
          }}
        >
          <div style={{ borderRadius: 18, overflow: "hidden", backgroundColor: "#F0EDE8", boxShadow: "0 20px 44px rgba(0,0,0,0.08)" }}>
            <img
              src={item.url}
              alt={item.alt_text || item.title}
              style={{ width: "100%", display: "block", objectFit: "cover" }}
            />
          </div>

          <div>
            {item.category && (
              <span style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#B8946A",
                marginBottom: 12,
              }}>
                {item.category}
              </span>
            )}

            <h1 style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 400,
              color: "#1E1A16",
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}>
              {item.title}
            </h1>

            {item.description && (
              <p style={{ fontSize: 15, color: "#6B6057", lineHeight: 1.75, margin: "0 0 28px" }}>
                {item.description}
              </p>
            )}

            {item.tags.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B8F82", marginBottom: 10 }}>
                  Tag
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 12,
                      padding: "4px 12px",
                      borderRadius: 16,
                      backgroundColor: "#F0EDE8",
                      color: "#6B6057",
                      border: "1px solid #E8E4DE",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.published_at && (
              <p style={{ fontSize: 12, color: "#9B8F82" }}>
                Pubblicato il {new Date(item.published_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #E8E4DE" }}>
              <Link
                href={`/catalogue/${slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#9B7A50",
                  textDecoration: "none",
                  letterSpacing: "0.04em",
                }}
              >
                ← Torna a {collection.name}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
