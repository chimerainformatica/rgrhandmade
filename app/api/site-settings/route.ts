import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/site-settings
 * PUBLIC API - Returns public site settings (SEO, title, description, etc)
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .single();

    if (error) {
      console.error("GET /api/site-settings error:", error);
      // Return default settings if not found
      return NextResponse.json({
        title: "RGR Handmade",
        description: "",
        favicon_url: "/favicon.ico",
        language: "it",
        theme: "light"
      });
    }

    // Return only public-safe settings
    const publicSettings = {
      title: data?.title || "RGR Handmade",
      description: data?.description || "",
      favicon_url: data?.favicon_url || "/favicon.ico",
      language: data?.language || "it",
      theme: data?.theme || "light",
      social_links: data?.social_links || {}
    };

    return NextResponse.json(publicSettings);
  } catch (err) {
    console.error("GET /api/site-settings error:", err);
    // Return safe defaults
    return NextResponse.json({
      title: "RGR Handmade",
      description: "",
      favicon_url: "/favicon.ico",
      language: "it",
      theme: "light"
    });
  }
}
