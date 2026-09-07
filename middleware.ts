import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isDev = process.env.NODE_ENV !== "production";

function createCsp() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net https://app.legalblink.it${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://placehold.co https://mzxsbwoeupzctfrtaemd.supabase.co https://www.google-analytics.com https://www.facebook.com",
    "media-src 'self'",
    "frame-src https://challenges.cloudflare.com https://app.legalblink.it",
    `connect-src 'self' ws://localhost:* wss://localhost:*${isDev ? " ws://127.0.0.1:* wss://127.0.0.1:*" : ""} https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com https://app.legalblink.it`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const csp = createCsp();
  const requestHeaders = new Headers(request.headers);

  if (process.env.VITRIX_MAINTENANCE === "true") {
    const path = request.nextUrl.pathname;
    const allowed =
      path.startsWith("/admin") ||
      path.startsWith("/api/vitrix/status") ||
      path.startsWith("/_next") ||
      path.startsWith("/favicon") ||
      path === "/workingprogress";
    if (!allowed) {
      const rewrite = NextResponse.rewrite(new URL("/workingprogress", request.url));
      rewrite.headers.set("Content-Security-Policy", csp);
      return rewrite;
    }
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", csp);

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminRoot = request.nextUrl.pathname === "/admin";
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";

  if (!isAdminRoute) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        response.headers.set("Content-Security-Policy", csp);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // I cookie di sessione aggiornati da getUser() (rotazione refresh token) vivono
  // su `response`. Vanno ricopiati su QUALSIASI nuova response, altrimenti
  // browser e server si desincronizzano e la sessione cade. (Supabase SSR)
  const withSessionCookies = (target: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie);
    });
    target.headers.set("Content-Security-Policy", csp);
    return target;
  };

  if (isAdminRoute && !isLoginRoute && !user) {
    if (process.env.NODE_ENV !== "production" && isAdminRoot) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return withSessionCookies(NextResponse.redirect(url));
  }

  if (isLoginRoute && user) {
    return withSessionCookies(NextResponse.redirect(new URL("/admin", request.url)));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|uploads).*)",
  ],
};
