import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { logVitrixError } from "@/lib/vitrix/logs";
import {
  ensureEventCategory,
  listEventCategories,
  normalizeEventCategoryName,
} from "@/lib/vitrix/event-categories";

function errorStatus(err: unknown) {
  const status = err && typeof err === "object" && "status" in err ? (err as { status?: unknown }).status : undefined;
  return typeof status === "number" ? status : 500;
}

export async function GET() {
  try {
    const auth = await requireVitrixApiPermission("vitrix.read");
    if ("response" in auth) return auth.response;

    const supabase = auth.local ? await createServerClient() : createAdminClient();
    const categories = await listEventCategories(supabase);
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("GET /api/vitrix/events/categories error:", err);
    await logVitrixError(err, "/api/vitrix/events/categories");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVitrixApiPermission("vitrix.press.write");
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const name = normalizeEventCategoryName(String(body?.name ?? ""));

    if (!name) {
      return NextResponse.json({ error: "Il nome della categoria è obbligatorio." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const category = await ensureEventCategory(supabase, name);
    return NextResponse.json({ success: true, category });
  } catch (err) {
    await logVitrixError(err, "/api/vitrix/events/categories");
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: errorStatus(err) });
  }
}
