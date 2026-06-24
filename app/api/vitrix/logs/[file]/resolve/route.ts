import { NextResponse } from "next/server";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { resolveVitrixLog } from "@/lib/vitrix/logs";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ file: string }> }) {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  const { file } = await context.params;

  try {
    return NextResponse.json({ resolved: await resolveVitrixLog(decodeURIComponent(file)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Log non disponibile." }, { status: 404 });
  }
}
