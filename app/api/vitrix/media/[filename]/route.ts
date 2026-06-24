import { NextRequest, NextResponse } from "next/server";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { logVitrixError } from "@/lib/vitrix/logs";
import { deleteMediaFile } from "@/lib/vitrix/media";

type Ctx = { params: Promise<{ filename: string }> };

// DELETE /api/vitrix/media/[filename]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.media.write");
    if ("response" in auth) return auth.response;

    const { filename } = await params;

    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { error: "Nome file non valido" },
        { status: 400 },
      );
    }

    const deleted = await deleteMediaFile(filename);

    if (!deleted) {
      return NextResponse.json({ error: "File non trovato" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vitrix/media/[filename] error:", err);
    await logVitrixError(err, "/api/vitrix/media/[filename]");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
