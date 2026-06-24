import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { MediaCollection, MediaCollectionItem } from "@/lib/vitrix/types";

type Props = { params: Promise<{ slug: string }> };

type CategoryTab = { key: string; label: string; count: number };

async function getCollectionData(slug: string): Promise<{ collection: MediaCollection; items: MediaCollectionItem[] } | null> {
  const config = getSupabaseConfig();
  if (!config.hasServiceRole) return null;

  const supabase = createAdminClient();

  const { data: collection, error } = await supabase
    .from("media_collections")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !collection) return null;

  const { data: items } = await supabase
    .from("media_collection_items")
    .select("*")
    .eq("collection_id", collection.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  return {
    collection: collection as MediaCollection,
    items: (items ?? []) as MediaCollectionItem[],
  };
}

function buildCategoryTabs(items: MediaCollectionItem[]): CategoryTab[] {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = item.category?.trim() || "all";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const tabs: CategoryTab[] = [{ key: "all", label: "Tutte", count: items.length }];
  for (const key of Array.from(map.keys()).filter((value) => value !== "all").sort((a, b) => a.localeCompare(b, "it"))) {
    tabs.push({ key, label: key, count: map.get(key) ?? 0 });
  }

  return tabs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionData(slug);
  if (!data) return { title: "Collection non trovata" };
  return {
    title: data.collection.name,
    description: data.collection.description ?? undefined,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCollectionData(slug);

  if (!data) notFound();

  const { collection, items } = data;
  const tabs = buildCategoryTabs(items);
  const grouped = tabs.map((tab) => ({
    ...tab,
    items: tab.key === "all" ? items : items.filter((item) => (item.category?.trim() || "all") === tab.key),
  }));

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
      <header
        style={{
          borderBottom: "1px solid rgba(232,228,222,0.9)",
          padding: "28px 40px",
          backgroundColor: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <nav style={{ marginBottom: 12, fontSize: 12, color: "#9B8F82", letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#9B8F82", textDecoration: "none" }}>Home</Link>
            {" / "}
            <span>Catalogo</span>
            {" / "}
            <span style={{ color: "#3A3530" }}>{collection.name}</span>
          </nav>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "end" }}>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8946A" }}>
                Collezione
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-cormorant, serif)",
                  fontSize: "clamp(34px, 5vw, 68px)",
                  fontWeight: 400,
                  color: "#1E1A16",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {collection.name}
              </h1>
              {collection.description && (
                <p style={{ marginTop: 14, color: "#6B6057", fontSize: 15, lineHeight: 1.75, maxWidth: 760, marginBottom: 0 }}>
                  {collection.description}
                </p>
              )}
            </div>

            <div
              style={{
                justifySelf: "end",
                padding: "18px 20px",
                border: "1px solid rgba(232,228,222,0.9)",
                borderRadius: 18,
                background: "rgba(255,255,255,0.8)",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9B8F82", marginBottom: 10 }}>
                Categorie
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tabs.map((tab) => (
                  <span
                    key={tab.key}
                    style={{
                      fontSize: 11,
                      padding: "5px 10px",
                      borderRadius: 999,
                      backgroundColor: tab.key === "all" ? "#1E1A16" : "#F0EDE8",
                      color: tab.key === "all" ? "#FAF8F4" : "#6B6057",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tab.label} {tab.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 40px 72px" }}>
        <div style={{ marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", gap: 10, minWidth: "max-content", paddingBottom: 4 }}>
            {tabs.map((tab, index) => (
              <a
                key={tab.key}
                href={`#tab-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  border: "1px solid #D8D0C6",
                  backgroundColor: index === 0 ? "#1E1A16" : "rgba(255,255,255,0.75)",
                  color: index === 0 ? "#FAF8F4" : "#6B6057",
                  textDecoration: "none",
                  padding: "11px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
                <span style={{ opacity: 0.75 }}>({tab.count})</span>
              </a>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9B8F82", fontSize: 14, padding: "80px 0" }}>
            Nessun elemento disponibile in questa collezione.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 42 }}>
            {grouped.map((group, groupIndex) => (
              <section key={group.key} id={`tab-${groupIndex}`} style={{ scrollMarginTop: 120 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-cormorant, serif)",
                        fontSize: "clamp(24px, 3vw, 36px)",
                        fontWeight: 400,
                        margin: 0,
                        lineHeight: 1.1,
                      }}
                    >
                      {group.key === "all" ? "Tutte le immagini" : group.label}
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8C7B6B" }}>
                      {group.count} elementi
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 22,
                  }}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/catalogue/${slug}/${item.slug}`}
                      style={{ textDecoration: "none", display: "block", color: "inherit" }}
                    >
                      <article
                        style={{
                          backgroundColor: "rgba(255,255,255,0.82)",
                          borderRadius: 18,
                          overflow: "hidden",
                          border: "1px solid rgba(232,228,222,0.95)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                          transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                        }}
                        onMouseEnter={(event) => {
                          const el = event.currentTarget as HTMLElement;
                          el.style.transform = "translateY(-3px)";
                          el.style.boxShadow = "0 14px 34px rgba(0,0,0,0.08)";
                          el.style.borderColor = "rgba(184,148,106,0.35)";
                        }}
                        onMouseLeave={(event) => {
                          const el = event.currentTarget as HTMLElement;
                          el.style.transform = "translateY(0)";
                          el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.04)";
                          el.style.borderColor = "rgba(232,228,222,0.95)";
                        }}
                      >
                        <div style={{ aspectRatio: "4 / 5", overflow: "hidden", backgroundColor: "#F0EDE8" }}>
                          <img
                            src={item.url}
                            alt={item.alt_text || item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div style={{ padding: "16px 16px 18px" }}>
                          {item.category && (
                            <span style={{
                              display: "inline-block",
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              color: "#B8946A",
                              marginBottom: 8,
                            }}>
                              {item.category}
                            </span>
                          )}
                          <h3 style={{
                            fontFamily: "var(--font-cormorant, serif)",
                            fontSize: 22,
                            fontWeight: 400,
                            color: "#1E1A16",
                            margin: 0,
                            lineHeight: 1.15,
                          }}>
                            {item.title}
                          </h3>
                          {item.description && (
                            <p style={{
                              marginTop: 8,
                              marginBottom: 0,
                              fontSize: 13,
                              color: "#6B6057",
                              lineHeight: 1.6,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical" as const,
                              overflow: "hidden",
                            }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
