import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import type { MediaCollection } from "@/lib/vitrix/types";

// GET /api/vitrix/collections
export async function GET(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    if (auth.local) {
      return NextResponse.json({ collections: [] });
    }

    const supabase = createAdminClient();
    const url = new URL(req.url);
    const includeCount = url.searchParams.get("count") !== "false";

    const { data, error } = await supabase
      .from("media_collections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Collections query error:", error);
      await logVitrixError(error, "/api/vitrix/collections");
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 },
      );
    }

    let collections = (data ?? []) as MediaCollection[];

    if (includeCount) {
      const counts = await Promise.all(
        collections.map((c) =>
          supabase
            .from("media_collection_items")
            .select("id", { count: "exact", head: true })
            .eq("collection_id", c.id),
        ),
      );
      collections = collections.map((c, i) => ({
        ...c,
        item_count: counts[i].count ?? 0,
      }));
    }

    return NextResponse.json({ collections });
  } catch (err) {
    console.error("GET /api/vitrix/collections error:", err);
    await logVitrixError(err, "/api/vitrix/collections");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/vitrix/collections
export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.collections.write");
    if ("response" in auth) return auth.response;

    const body = await req.json();
    const { name, slug, description, status, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("media_collections")
      .insert({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        status: status || "published",
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
      }
      console.error("Insert collection error:", error);
      await logVitrixError(error, "/api/vitrix/collections");
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      collection: data as MediaCollection,
    });
  } catch (err) {
    console.error("POST /api/vitrix/collections error:", err);
    await logVitrixError(err, "/api/vitrix/collections");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
