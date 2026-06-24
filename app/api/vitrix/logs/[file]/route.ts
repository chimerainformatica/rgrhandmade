import { NextResponse, type NextRequest } from "next/server";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { readVitrixLog } from "@/lib/vitrix/logs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ file: string }> }) {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  const { file } = await context.params;
  const status = request.nextUrl.searchParams.get("status") === "resolved" ? "resolved" : "open";

  try {
    return NextResponse.json({ file, status, content: await readVitrixLog(decodeURIComponent(file), status) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Log non disponibile." }, { status: 404 });
  }
}
