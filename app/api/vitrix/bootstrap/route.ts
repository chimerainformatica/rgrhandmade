import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentVitrixUser } from "@/lib/vitrix/auth";
import { getVitrixBootstrap } from "@/lib/vitrix/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSupabaseConfig();

  if (config.isConfigured) {
    const user = await getCurrentVitrixUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes("vitrix.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

  }

  const data = await getVitrixBootstrap(await getCurrentVitrixUser());
  return NextResponse.json(data);
}
