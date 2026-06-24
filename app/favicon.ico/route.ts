import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/vitrix/settings";

const FALLBACK_FAVICON = "/uploads/vitrix/favicon-1779370634192.ico";

export async function GET(request: Request) {
  const settings = await getSiteSettings();
  const faviconPath =
    settings.favicon_path && settings.favicon_path !== "/favicon.ico"
      ? settings.favicon_path
      : FALLBACK_FAVICON;

  return NextResponse.redirect(new URL(faviconPath, request.url));
}
