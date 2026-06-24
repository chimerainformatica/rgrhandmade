import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true, clearedAt: new Date().toISOString() });
}
