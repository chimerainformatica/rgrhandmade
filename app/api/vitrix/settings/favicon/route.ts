import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { updateSiteSettings } from "@/lib/vitrix/settings";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set([".ico", ".png", ".svg", ".jpg", ".jpeg", ".webp"]);
const MAX_BYTES = 512 * 1024;

export async function POST(request: NextRequest) {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  if (!getSupabaseConfig().hasServiceRole) {
    return NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File favicon mancante." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Formato favicon non supportato." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Favicon troppo grande. Limite 512KB." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "vitrix");
  await mkdir(uploadDir, { recursive: true });

  const filename = `favicon-${Date.now()}${ext}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const faviconPath = `/uploads/vitrix/${filename}`;
  const settings = await updateSiteSettings({ favicon_path: faviconPath });

  return NextResponse.json({ settings, path: faviconPath });
}
