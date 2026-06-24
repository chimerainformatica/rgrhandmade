import { NextResponse } from "next/server";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { listVitrixLogs } from "@/lib/vitrix/logs";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  return NextResponse.json(await listVitrixLogs());
}
