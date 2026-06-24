import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSupabaseConfig();

  return NextResponse.json({
    vitrix: true,
    supabaseConfigured: config.isConfigured,
    serviceRoleConfigured: config.hasServiceRole,
    mode: config.hasServiceRole ? "supabase" : "local",
  });
}
