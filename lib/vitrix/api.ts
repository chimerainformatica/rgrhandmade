import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentVitrixUser } from "@/lib/vitrix/auth";
import { initVitrixErrorLogger } from "@/lib/vitrix/logs";

initVitrixErrorLogger();

export async function requireVitrixApiPermission(
  requiredPermission = "vitrix.settings.manage",
) {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    if (process.env.NODE_ENV !== "production")
      return { user: null, local: true };
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await getCurrentVitrixUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (
    !user.permissions.includes(requiredPermission) &&
    !user.permissions.includes("vitrix.superadmin")
  ) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, local: false };
}
