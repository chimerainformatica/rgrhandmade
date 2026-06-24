import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin";

  if (code) {
    // Client SSR: exchangeCodeForSession scrive i cookie di sessione sulla
    // response. Con il client generico @supabase/supabase-js i cookie NON
    // venivano persistiti e la sessione restava vuota dopo il redirect.
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-error", request.url));
}
