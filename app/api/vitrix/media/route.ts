import { NextRequest, NextResponse } from "next/server";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import { listMediaFiles, saveMediaFile } from "@/lib/vitrix/media";

// GET /api/vitrix/media
export async function GET() {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    if (auth.local) {
      return NextResponse.json({ files: [] });
    }

    const files = await listMediaFiles();
    return NextResponse.json({ files });
  } catch (err) {
    console.error("GET /api/vitrix/media error:", err);
    await logVitrixError(err, "/api/vitrix/media");
    return NextResponse.json({ files: [] });
  }
}

// POST /api/vitrix/media — multipart/form-data con campo "file"
export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.media.write");
    if ("response" in auth) return auth.response;

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Nessun file ricevuto" },
        { status: 400 },
      );
    }

    const originalName = file instanceof File ? file.name : "upload";
    const result = await saveMediaFile(file, originalName);

    return NextResponse.json({ success: true, file: result }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/vitrix/media error:", err);
    await logVitrixError(err, "/api/vitrix/media");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
