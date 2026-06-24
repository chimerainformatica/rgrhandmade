import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { getSiteSettings, updateSiteSettings } from "@/lib/vitrix/settings";
import type { VitrixSiteSettings } from "@/lib/vitrix/types";

export const dynamic = "force-dynamic";

const editableKeys: Array<keyof VitrixSiteSettings> = [
  "site_name",
  "seo_title",
  "seo_description",
  "canonical_url",
  "robots_index",
  "robots_follow",
  "og_title",
  "og_description",
  "og_image",
  "favicon_path",
  "default_language"
];

export async function GET() {
  const guard = await requireVitrixApiPermission("vitrix.read");
  if ("response" in guard) return guard.response;

  return NextResponse.json({ settings: await getSiteSettings() });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  if (!getSupabaseConfig().hasServiceRole) {
    return NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 });
  }

  const body = (await request.json()) as Partial<VitrixSiteSettings>;
  const payload = editableKeys.reduce<Partial<VitrixSiteSettings>>((acc, key) => {
    if (key in body) {
      acc[key] = body[key] as never;
    }
    return acc;
  }, {});

  const settings = await updateSiteSettings(payload);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({ settings });
}
