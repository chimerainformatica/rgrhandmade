import { NextResponse } from "next/server";
import { getPublishedPrivacyConfig } from "@/lib/privacy/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPublishedPrivacyConfig();
  return NextResponse.json({ config }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
