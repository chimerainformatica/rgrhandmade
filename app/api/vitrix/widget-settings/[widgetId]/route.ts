import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ widgetId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { widgetId } = await params;
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return NextResponse.json({ config: null }, { status: 200 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("vitrix_widget_settings")
    .select("config, updated_at")
    .eq("widget_id", widgetId)
    .single();

  if (error || !data) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config: data.config, updated_at: data.updated_at });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { widgetId } = await params;

  const guard = await requireVitrixApiPermission("vitrix.settings.manage");
  if ("response" in guard) return guard.response;

  if (!getSupabaseConfig().hasServiceRole) {
    return NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vitrix_widget_settings")
    .upsert({ widget_id: widgetId, config: body, updated_at: new Date().toISOString() })
    .select("config, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/");

  return NextResponse.json({ config: data.config, updated_at: data.updated_at });
}
